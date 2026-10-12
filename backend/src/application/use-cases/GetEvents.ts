import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { CalendarEvent } from '../../domain/entities/Event';
import { Actor } from '../../domain/entities/User';
import { visibleOwnerFilter } from '../policies/eventAccess';

export class GetEventsUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(actor: Actor, rangeStart?: string, rangeEnd?: string): Promise<CalendarEvent[]> {
    return this.eventRepository.findAll(visibleOwnerFilter(actor), rangeStart, rangeEnd);
  }
}
