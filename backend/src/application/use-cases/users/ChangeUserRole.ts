import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { Role, User } from '../../../domain/entities/User';
import { NotFoundError, BadRequestError } from '../../errors/AppError';

export class ChangeUserRoleUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(targetUserId: string, newRole: Role, actorUserId: string): Promise<User> {
    if (targetUserId === actorUserId) {
      throw new BadRequestError('Нельзя изменить собственную роль', 'CANNOT_CHANGE_OWN_ROLE');
    }

    const updated = await this.userRepo.updateRole(targetUserId, newRole);
    if (!updated) throw new NotFoundError('Пользователь не найден');
    return updated;
  }
}