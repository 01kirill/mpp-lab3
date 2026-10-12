import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../application/errors/AppError';
import { appLogger } from '../../../infrastructure/logging/logger';

// Известные ошибки библиотек и PostgreSQL → корректный 4xx вместо 500
const KNOWN_ERRORS: Record<string, [number, string]> = {
  'entity.parse.failed': [400, 'Некорректный JSON в теле запроса'],
  LIMIT_FILE_SIZE: [413, 'Файл слишком большой (максимум 20 МБ)'],
  LIMIT_UNEXPECTED_FILE: [400, 'Файл нужно передать в поле "file"'],
  '22P02': [404, 'Ресурс не найден'], // некорректный UUID в пути
  '23503': [404, 'Связанный ресурс не найден'],
  '23505': [409, 'Запись уже существует'],
};

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: (err as any).details ?? undefined,
      requestId: req.requestId,
    });
  }

  const e = err as { type?: string; code?: string };
  const known = KNOWN_ERRORS[e?.type ?? ''] ?? KNOWN_ERRORS[e?.code ?? ''];
  if (known) {
    return res.status(known[0]).json({ error: known[1], code: e.code ?? e.type, requestId: req.requestId });
  }

  appLogger.error('http.unhandled_error', {
    requestId: req.requestId,
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    method: req.method,
    path: req.path,
  });

  return res.status(500).json({
    error: 'Внутренняя ошибка сервера',
    requestId: req.requestId,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: `Маршрут ${req.method} ${req.path} не найден`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.requestId,
  });
}
