import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { CalendarEvent } from '../../domain/entities/Event';
import { Actor } from '../../domain/entities/User';
import { assertCanRead } from '../policies/eventAccess';

export class GetEventByIdUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(id: string, actor: Actor): Promise<CalendarEvent> {
    return assertCanRead(await this.eventRepository.findById(id), actor);
  }
}
