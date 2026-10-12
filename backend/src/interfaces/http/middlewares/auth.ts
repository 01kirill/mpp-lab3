import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../../../application/services/TokenService';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { ForbiddenError, UnauthorizedError } from '../../../application/errors/AppError';
import { Role } from '../../../domain/entities/User';

export interface AuthUser {
  id: string;
  role: Role;
  sessionId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- единственный способ расширить Express.Request
  namespace Express {
    interface Request {
      auth?: AuthUser;
      requestId?: string;
    }
  }
}

export function authMiddleware(tokenService: TokenService, sessionRepo: ISessionRepository) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) {
        throw new UnauthorizedError('Отсутствует токен', 'NO_TOKEN');
      }
      const token = header.slice(7);
      let payload;
      try {
        payload = tokenService.verifyAccess(token);
      } catch (e: any) {
        if (e.name === 'TokenExpiredError') throw new UnauthorizedError('Токен истёк', 'TOKEN_EXPIRED');
        throw new UnauthorizedError('Недействительный токен', 'INVALID_TOKEN');
      }

      const session = await sessionRepo.findById(payload.sid);
      if (!session || session.revokedAt) {
        throw new UnauthorizedError('Сессия недействительна', 'SESSION_REVOKED');
      }
      if (new Date(session.expiresAt) < new Date()) {
        throw new UnauthorizedError('Сессия истекла', 'SESSION_EXPIRED');
      }
      if (!session.isActive) throw new UnauthorizedError('Пользователь недоступен', 'USER_UNAVAILABLE');

      // Роль — из БД, а не из токена: смена роли действует сразу
      req.auth = { id: session.userId, role: session.role, sessionId: session.id };
      next();
    } catch (e) {
      next(e);
    }
  };
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new UnauthorizedError());
    if (!roles.includes(req.auth.role)) {
      return next(new ForbiddenError('Недостаточно прав для этой операции', 'FORBIDDEN_ROLE'));
    }
    next();
  };
}