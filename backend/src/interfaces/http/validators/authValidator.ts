import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(8, 'Пароль должен быть не менее 8 символов').max(72),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Некорректный email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export const changeRoleSchema = z.object({
  role: z.enum(['admin', 'editor', 'viewer']),
});

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});