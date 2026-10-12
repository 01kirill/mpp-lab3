import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { CalendarEvent, UpdateCalendarEvent } from '../../domain/entities/Event';
import { Actor } from '../../domain/entities/User';
import { ConflictError } from '../errors/AppError';
import { assertValidEventTime } from '../policies/eventTime';
import { assertCanWrite } from '../policies/eventAccess';

export class UpdateEventUseCase {
  constructor(private eventRepository: IEventRepository) {}

  async execute(id: string, data: UpdateCalendarEvent, actor: Actor): Promise<CalendarEvent> {
    const existing = assertCanWrite(await this.eventRepository.findById(id), actor);

    const merged = {
      title: data.title ?? existing.title,
      description: data.description !== undefined ? data.description : existing.description,
      location: data.location !== undefined ? data.location : existing.location,
      startTime: data.startTime ?? existing.startTime,
      endTime: data.endTime ?? existing.endTime,
      allDay: data.allDay ?? existing.allDay,
      color: data.color ?? existing.color,
    };

    assertValidEventTime(merged.startTime, merged.endTime, merged.allDay);

    const updated = await this.eventRepository.update(id, merged, data.expectedUpdatedAt);
    if (!updated) {
      throw new ConflictError('Событие уже изменили или удалили. Закройте форму и откройте событие заново', 'EVENT_CONFLICT');
    }
    return updated;
  }
}
