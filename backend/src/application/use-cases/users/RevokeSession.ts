import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { NotFoundError } from '../../errors/AppError';

export class RevokeSessionUseCase {
  constructor(private sessionRepo: ISessionRepository) {}

  async execute(sessionId: string): Promise<void> {
    if (!(await this.sessionRepo.revoke(sessionId))) throw new NotFoundError('Активная сессия не найдена');
  }
}