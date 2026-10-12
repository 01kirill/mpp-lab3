import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Повторите через 15 минут', code: 'TOO_MANY_LOGIN_ATTEMPTS' },
  skipSuccessfulRequests: true,
});

// Второй барьер по email: не обходится сменой IP. Цена — атакующий может временно заблокировать вход в чужой аккаунт.
export const loginEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `email:${String(req.body?.email ?? '').trim().toLowerCase()}`,
  message: { error: 'Слишком много попыток входа в этот аккаунт. Повторите через 15 минут', code: 'TOO_MANY_LOGIN_ATTEMPTS' },
  skipSuccessfulRequests: true,
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { error: 'Слишком много регистраций. Повторите через час', code: 'TOO_MANY_REGISTRATIONS' },
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Слишком много запросов на сброс пароля', code: 'TOO_MANY_RESET_REQUESTS' },
});