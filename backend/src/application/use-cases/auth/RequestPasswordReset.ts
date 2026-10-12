import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { IPasswordResetRepository } from '../../../domain/repositories/IPasswordResetRepository';
import { TokenService } from '../../services/TokenService';
import { EmailService } from '../../services/EmailService';
import { AuthAuditService } from '../../services/AuthAuditService';

export class RequestPasswordResetUseCase {
  constructor(
    private userRepo: IUserRepository,
    private resetRepo: IPasswordResetRepository,
    private tokenService: TokenService,
    private emailService: EmailService,
    private audit: AuthAuditService,
    private appUrl: string
  ) {}

  async execute(email: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      this.audit.passwordResetRequested(email);
      return;
    }

    const { raw, hash } = this.tokenService.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await this.resetRepo.create({ userId: user.id, tokenHash: hash, expiresAt });

    const link = `${this.appUrl}/reset-password?token=${raw}`;
    // Письмо уходит в фоне: ответ не ждёт SMTP, поэтому его время не выдаёт, существует ли email.
    // Сбой отправки логирует сам сервис почты.
    void this.emailService.sendPasswordReset(user.email, link).catch(() => undefined);

    this.audit.passwordResetRequested(email);
  }
}