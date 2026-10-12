import { ValidationError } from '../errors/AppError';

// All-day событие хранит календарную дату без часового пояса («плавающую»):
// UTC-полночь первого дня … 23:59:59.999Z последнего. Клиент читает её UTC-методами,
// поэтому 12 октября остаётся 12 октября в любом поясе.
const ALL_DAY_START = 'T00:00:00.000Z';
const ALL_DAY_END = 'T23:59:59.999Z';

export function assertValidEventTime(startTime: string, endTime: string, allDay: boolean): void {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (start >= end) {
    throw new ValidationError('Время начала должно быть раньше времени окончания');
  }
  if (allDay && !(start.toISOString().endsWith(ALL_DAY_START) && end.toISOString().endsWith(ALL_DAY_END))) {
    throw new ValidationError(
      `Событие на весь день задаётся датами: начало YYYY-MM-DD${ALL_DAY_START}, окончание YYYY-MM-DD${ALL_DAY_END}`
    );
  }
}
