import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { User } from '../../../domain/entities/User';
import { NotFoundError, BadRequestError } from '../../errors/AppError';

export class SetUserActiveUseCase {
  constructor(
    private userRepo: IUserRepository,
    private sessionRepo: ISessionRepository
  ) {}

  async execute(targetUserId: string, isActive: boolean, actorUserId: string): Promise<User> {
    if (targetUserId === actorUserId) {
      throw new BadRequestError('Нельзя деактивировать себя', 'CANNOT_DEACTIVATE_SELF');
    }

    const updated = await this.userRepo.setActive(targetUserId, isActive);
    if (!updated) throw new NotFoundError('Пользователь не найден');

    if (!isActive) await this.sessionRepo.revokeAllForUser(targetUserId);
    return updated;
  }
}