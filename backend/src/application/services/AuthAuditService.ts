import { ILogger } from '../../infrastructure/logging/logger';

export class AuthAuditService {
  constructor(private logger: ILogger) {}

  loginSuccess(email: string, ip: string | null, userAgent: string | null): void {
    this.logger.info('auth.login.success', { email, ip, userAgent });
  }

  loginFailure(email: string, ip: string | null, reason: string): void {
    this.logger.warn('auth.login.failure', { email, ip, reason });
  }

  tokenRefresh(userId: string, sessionId: string): void {
    this.logger.info('auth.token.refresh', { userId, sessionId });
  }

  logout(userId: string, sessionId: string): void {
    this.logger.info('auth.logout', { userId, sessionId });
  }

  passwordResetRequested(email: string): void {
    this.logger.info('auth.password.reset.requested', { email });
  }

  passwordResetCompleted(userId: string): void {
    this.logger.info('auth.password.reset.completed', { userId });
  }
}