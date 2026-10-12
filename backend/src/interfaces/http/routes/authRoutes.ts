import { RequestHandler, Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { validate } from '../middlewares/validate';
import { loginLimiter, loginEmailLimiter, registerLimiter, passwordResetLimiter } from '../middlewares/rateLimit';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/authValidator';

export function createAuthRouter(controller: AuthController, auth: RequestHandler): Router {
  const router = Router();

  router.post('/register', registerLimiter, validate(registerSchema), controller.register);
  router.post('/login', loginLimiter, loginEmailLimiter, validate(loginSchema), controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.post('/forgot-password', passwordResetLimiter, validate(forgotPasswordSchema), controller.forgotPassword);
  router.post('/reset-password', validate(resetPasswordSchema), controller.resetPassword);
  router.get('/me', auth, controller.me);

  return router;
}
