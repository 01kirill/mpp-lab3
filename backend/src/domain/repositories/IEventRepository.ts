import { CalendarEvent, NewCalendarEvent } from '../entities/Event';

export interface IEventRepository {
  /** userId = null — события всех пользователей */
  findAll(userId: string | null, rangeStart?: string, rangeEnd?: string): Promise<CalendarEvent[]>;
  findById(id: string): Promise<CalendarEvent | null>;
  create(userId: string, data: NewCalendarEvent): Promise<CalendarEvent>;
  /** null — события нет или (при expectedUpdatedAt) оно уже изменено другим запросом */
  update(id: string, data: Required<NewCalendarEvent>, expectedUpdatedAt?: string): Promise<CalendarEvent | null>;
  delete(id: string): Promise<boolean>;
}
