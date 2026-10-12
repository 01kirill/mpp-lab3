import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { CalendarEvent, NewCalendarEvent } from '../../domain/entities/Event';
import { assertValidEventTime } from '../policies/eventTime';

export class CreateEventUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(userId: string, data: NewCalendarEvent): Promise<CalendarEvent> {
    assertValidEventTime(data.startTime, data.endTime, data.allDay ?? false);
    return this.eventRepository.create(userId, data);
  }
}
