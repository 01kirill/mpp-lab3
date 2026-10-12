import { ISessionRepository } from '../../../domain/repositories/ISessionRepository';
import { Session } from '../../../domain/entities/User';

export class ListActiveSessionsUseCase {
  constructor(private sessionRepo: ISessionRepository) {}

  async execute(): Promise<(Session & { email: string })[]> {
    return this.sessionRepo.findAllActive();
  }
}