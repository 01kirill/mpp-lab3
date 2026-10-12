import { Role, Session } from '../entities/User';

export interface ISessionRepository {
  create(data: {
    userId: string;
    refreshHash: string;
    userAgent: string | null;
    ip: string | null;
    expiresAt: Date;
  }): Promise<Session>;
  /** Сессия вместе с текущими ролью и статусом пользователя */
  findById(id: string): Promise<(Session & { refreshHash: string; role: Role; isActive: boolean }) | null>;
  findAllActive(): Promise<(Session & { email: string })[]>;
  rotate(id: string, refreshHash: string, expiresAt: Date): Promise<void>;
  revoke(id: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<void>;
}
