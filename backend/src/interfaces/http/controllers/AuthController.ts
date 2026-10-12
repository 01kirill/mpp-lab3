import { Request, Response, NextFunction, CookieOptions } from 'express';
import { RegisterUserUseCase } from '../../../application/use-cases/auth/RegisterUser';
import { LoginUserUseCase } from '../../../application/use-cases/auth/LoginUser';
import { RefreshSessionUseCase } from '../../../application/use-cases/auth/RefreshSession';
import { LogoutUserUseCase } from '../../../application/use-cases/auth/LogoutUser';
import { RequestPasswordResetUseCase } from '../../../application/use-cases/auth/RequestPasswordReset';
import { ResetPasswordUseCase } from '../../../application/use-cases/auth/ResetPassword';
import { GetCurrentUserUseCase } from '../../../application/use-cases/auth/GetCurrentUser';
import { UnauthorizedError } from '../../../application/errors/AppError';
import { env } from '../../../config/env';

const REFRESH_COOKIE = 'refresh_token';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.cookieSecure,
  path: '/api/auth',
};

/** Cookie хранит "<sessionId>.<refreshToken>" */
function readRefreshCookie(req: Request): { sessionId: string; token: string } | null {
  const [sessionId, token] = String(req.cookies?.[REFRESH_COOKIE] ?? '').split('.');
  return sessionId && token ? { sessionId, token } : null;
}

export class AuthController {
  constructor(
    private registerUC: RegisterUserUseCase,
    private loginUC: LoginUserUseCase,
    private refreshUC: RefreshSessionUseCase,
    private logoutUC: LogoutUserUseCase,
    private requestResetUC: RequestPasswordResetUseCase,
    private resetUC: ResetPasswordUseCase,
    private currentUserUC: GetCurrentUserUseCase,
    private refreshTtlMs: number
  ) {}

  private setRefreshCookie(res: Response, sessionId: string, token: string) {
    res.cookie(REFRESH_COOKIE, `${sessionId}.${token}`, { ...COOKIE_OPTIONS, maxAge: this.refreshTtlMs });
  }

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const user = await this.registerUC.execute(email, password);
      res.status(201).json({ id: user.id, email: user.email, role: user.role });
    } catch (e) { next(e); }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.loginUC.execute({
        email,
        password,
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
      });
      this.setRefreshCookie(res, result.sessionId, result.refreshToken);
      res.status(200).json({ accessToken: result.accessToken, user: result.user });
    } catch (e) { next(e); }
  };

  refresh = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookie = readRefreshCookie(req);
      if (!cookie) throw new UnauthorizedError('Refresh-токен отсутствует', 'NO_REFRESH');
      const result = await this.refreshUC.execute(cookie.sessionId, cookie.token);
      this.setRefreshCookie(res, cookie.sessionId, result.refreshToken);
      res.status(200).json({ accessToken: result.accessToken });
    } catch (e) {
      if (e instanceof UnauthorizedError) res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
      next(e);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookie = readRefreshCookie(req);
      if (cookie) await this.logoutUC.execute(cookie.sessionId, cookie.token);
      res.clearCookie(REFRESH_COOKIE, COOKIE_OPTIONS);
      res.status(204).send();
    } catch (e) { next(e); }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.requestResetUC.execute(req.body.email);
      res.status(200).json({ message: 'Если email существует, письмо отправлено' });
    } catch (e) { next(e); }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      await this.resetUC.execute(token, password);
      res.status(200).json({ message: 'Пароль успешно изменён' });
    } catch (e) { next(e); }
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json({ user: await this.currentUserUC.execute(req.auth!.id) });
    } catch (e) { next(e); }
  };
}
