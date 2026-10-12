import { Role, User, UserWithPassword } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<UserWithPassword | null>;
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(data: { email: string; passwordHash: string; role?: Role }): Promise<User>;
  updateRole(id: string, role: Role): Promise<User | null>;
  setActive(id: string, isActive: boolean): Promise<User | null>;
  updatePassword(id: string, passwordHash: string): Promise<void>;
}