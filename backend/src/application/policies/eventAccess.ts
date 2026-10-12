import { CalendarEvent } from '../../domain/entities/Event';
import { Actor } from '../../domain/entities/User';
import { ForbiddenError, NotFoundError } from '../errors/AppError';

// editor работает только со своими событиями; viewer видит все (только чтение); admin — всё.

/** null — без фильтра по владельцу */
export function visibleOwnerFilter(actor: Actor): string | null {
  return actor.role === 'editor' ? actor.id : null;
}

export function assertCanRead(event: CalendarEvent | null, actor: Actor): CalendarEvent {
  // Чужое событие для editor неотличимо от несуществующего — не раскрываем id
  if (!event || (actor.role === 'editor' && event.userId !== actor.id)) {
    throw new NotFoundError('Событие не найдено');
  }
  return event;
}

export function assertCanWrite(event: CalendarEvent | null, actor: Actor): CalendarEvent {
  assertCanRead(event, actor);
  if (actor.role !== 'admin' && event!.userId !== actor.id) {
    throw new ForbiddenError('Можно изменять только свои события', 'NOT_OWNER');
  }
  return event!;
}
