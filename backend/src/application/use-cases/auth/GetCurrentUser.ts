import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';
import { UnauthorizedError } from '../../errors/AppError';

export class GetCurrentUserUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(userId: string): Promise<Pick<User, 'id' | 'email' | 'role'>> {
    const user = await this.userRepo.findById(userId);
    if (!user) throw new UnauthorizedError('Пользователь недоступен', 'USER_UNAVAILABLE');
    return { id: user.id, email: user.email, role: user.role };
  }
}
