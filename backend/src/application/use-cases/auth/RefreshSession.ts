import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { TokenService } from '../../services/TokenService';
import { AuthAuditService } from '../../services/AuthAuditService';
import { UnauthorizedError } from '../../errors/AppError';

export class RefreshSessionUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private tokenService: TokenService,
    private audit: AuthAuditService
  ) {}

  /** Выдаёт новый access-токен и ротирует refresh-токен (старый перестаёт работать) */
  async execute(sessionId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || !this.tokenService.hashMatches(refreshToken, session.refreshHash)) {
      throw new UnauthorizedError('Неверный refresh-токен', 'INVALID_REFRESH');
    }
    if (session.revokedAt) throw new UnauthorizedError('Сессия отозвана', 'SESSION_REVOKED');
    if (new Date(session.expiresAt) < new Date()) {
      throw new UnauthorizedError('Сессия истекла', 'SESSION_EXPIRED');
    }
    if (!session.isActive) throw new UnauthorizedError('Пользователь недоступен', 'USER_UNAVAILABLE');

    const newRefresh = this.tokenService.generateRefreshToken();
    await this.sessionRepo.rotate(session.id, this.tokenService.hash(newRefresh), this.tokenService.refreshExpiresAt());

    const accessToken = this.tokenService.signAccess({ sub: session.userId, role: session.role, sid: session.id });
    this.audit.tokenRefresh(session.userId, session.id);
    return { accessToken, refreshToken: newRefresh };
  }
}
