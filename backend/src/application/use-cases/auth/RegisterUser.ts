import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { PasswordService } from '../../services/PasswordService';
import { ConflictError } from '../../errors/AppError';

export class RegisterUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordService: PasswordService
  ) {}

  async execute(email: string, password: string): Promise<User> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) throw new ConflictError('Пользователь с таким email уже существует', 'EMAIL_TAKEN');

    const hash = await this.passwordService.hash(password);
    return this.userRepo.create({ email, passwordHash: hash, role: 'editor' });
  }
}