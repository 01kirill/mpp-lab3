import { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { User } from '../../../domain/entities/User';

export class ListUsersUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(): Promise<User[]> {
    return this.userRepo.findAll();
  }
}