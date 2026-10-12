import { PasswordReset } from '../entities/User';

export interface IPasswordResetRepository {
  create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<PasswordReset>;
  findByHash(tokenHash: string): Promise<PasswordReset | null>;
  /** Атомарно помечает токен использованным; false — токен уже использован или истёк */
  consume(id: string): Promise<boolean>;
}
