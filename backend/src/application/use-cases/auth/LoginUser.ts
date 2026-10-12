import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { PasswordService } from '../../services/PasswordService';
import { TokenService } from '../../services/TokenService';
import { AuthAuditService } from '../../services/AuthAuditService';
import { UnauthorizedError } from '../../errors/AppError';

interface LoginInput {
  email: string;
  password: string;
  ip: string | null;
  userAgent: string | null;
}

interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  user: { id: string; email: string; role: string };
}

export class LoginUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private sessionRepo: ISessionRepository,
    private passwordService: PasswordService,
    private tokenService: TokenService,
    private audit: AuthAuditService
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const user = await this.userRepo.findByEmail(input.email);
    const valid = await this.passwordService.compare(input.password, user?.passwordHash ?? null);

    if (!user || !valid) {
      this.audit.loginFailure(input.email, input.ip, user ? 'bad_password' : 'user_not_found');
      throw new UnauthorizedError('Неверный email или пароль', 'INVALID_CREDENTIALS');
    }
    // Статус проверяем только после пароля: иначе ответ раскрывает, что аккаунт существует
    if (!user.isActive) {
      this.audit.loginFailure(input.email, input.ip, 'user_inactive');
      throw new UnauthorizedError('Учётная запись деактивирована', 'ACCOUNT_DISABLED');
    }

    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshHash = this.tokenService.hash(refreshToken);
    const expiresAt = this.tokenService.refreshExpiresAt();

    const session = await this.sessionRepo.create({
      userId: user.id,
      refreshHash,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt,
    });

    const accessToken = this.tokenService.signAccess({
      sub: user.id,
      role: user.role,
      sid: session.id,
    });

    this.audit.loginSuccess(user.email, input.ip, input.userAgent);

    return {
      accessToken,
      refreshToken,
      sessionId: session.id,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}