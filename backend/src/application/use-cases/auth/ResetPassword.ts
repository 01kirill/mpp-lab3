import { IPasswordResetRepository } from '../../../domain/repositories/IPasswordResetRepository';
import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { PasswordService } from '../../services/PasswordService';
import { TokenService } from '../../services/TokenService';
import { AuthAuditService } from '../../services/AuthAuditService';
import { BadRequestError } from '../../errors/AppError';

export class ResetPasswordUseCase {
  constructor(
    private resetRepo: IPasswordResetRepository,
    private userRepo: IUserRepository,
    private sessionRepo: ISessionRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private audit: AuthAuditService
  ) {}

  async execute(rawToken: string, newPassword: string): Promise<void> {
    const reset = await this.resetRepo.findByHash(this.tokenService.hash(rawToken));
    if (!reset) throw new BadRequestError('Токен недействителен', 'INVALID_RESET_TOKEN');
    if (reset.usedAt) throw new BadRequestError('Токен уже использован', 'RESET_TOKEN_USED');
    if (new Date(reset.expiresAt) < new Date()) {
      throw new BadRequestError('Токен истёк', 'RESET_TOKEN_EXPIRED');
    }

    const passwordHash = await this.passwordService.hash(newPassword);
    // Атомарное «погашение» токена: из параллельных запросов с одним токеном пройдёт только один
    if (!(await this.resetRepo.consume(reset.id))) {
      throw new BadRequestError('Токен уже использован', 'RESET_TOKEN_USED');
    }
    await this.userRepo.updatePassword(reset.userId, passwordHash);
    await this.sessionRepo.revokeAllForUser(reset.userId);

    this.audit.passwordResetCompleted(reset.userId);
  }
}
