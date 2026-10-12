import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { TokenService } from '../../services/TokenService';
import { AuthAuditService } from '../../services/AuthAuditService';

export class LogoutUserUseCase {
  constructor(
    private sessionRepo: ISessionRepository,
    private tokenService: TokenService,
    private audit: AuthAuditService
  ) {}

  /** Работает по refresh-cookie, поэтому выход возможен и с истёкшим access-токеном */
  async execute(sessionId: string, refreshToken: string): Promise<void> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session || !this.tokenService.hashMatches(refreshToken, session.refreshHash)) return;
    if (await this.sessionRepo.revoke(session.id)) this.audit.logout(session.userId, session.id);
  }
}
