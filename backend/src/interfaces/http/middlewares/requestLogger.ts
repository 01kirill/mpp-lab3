import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { ILogger } from '../../../infrastructure/logging/logger';

export function requestLogger(logger: ILogger) {
  return (req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    req.requestId = requestId;

    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      logger.info('http.request', {
        requestId,
        method: req.method,
        path: req.originalUrl.split('?')[0],
        status: res.statusCode,
        durationMs,
        userId: req.auth?.id ?? null,
        ip: req.ip ?? null,
      });
    });

    next();
  };
}