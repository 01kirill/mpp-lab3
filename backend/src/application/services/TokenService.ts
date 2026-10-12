import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Role } from '../../domain/entities/User';
import { env } from '../../config/env';

export interface AccessPayload {
  sub: string;
  role: Role;
  sid: string;
}

export class TokenService {
  signAccess(payload: AccessPayload): string {
    return jwt.sign(payload, env.jwtAccessSecret, { expiresIn: env.jwtAccessTtl as any });
  }

  verifyAccess(token: string): AccessPayload {
    return jwt.verify(token, env.jwtAccessSecret) as AccessPayload;
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(48).toString('hex');
  }

  hash(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  hashMatches(token: string, expectedHash: string): boolean {
    const a = Buffer.from(this.hash(token));
    const b = Buffer.from(expectedHash);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }

  refreshExpiresAt(): Date {
    return new Date(Date.now() + this.refreshTtlMs());
  }

  refreshTtlMs(): number {
    return env.jwtRefreshTtlDays * 24 * 60 * 60 * 1000;
  }

  generateResetToken(): { raw: string; hash: string } {
    const raw = crypto.randomBytes(32).toString('hex');
    return { raw, hash: this.hash(raw) };
  }
}
