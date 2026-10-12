import { KeyboardEvent } from 'react';
import { CalendarEvent } from '../types/Event';
import { allDayDates, dateKey, isSameDay } from '../utils/date';

interface Props {
  date: Date;
  currentMonth: number;
  events: CalendarEvent[];
  onSelectDay?: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onShowAll: (date: Date, events: CalendarEvent[]) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

const MAX_VISIBLE = 3;

export function DayCell({
  date,
  currentMonth,
  events,
  onSelectDay,
  onSelectEvent,
  onShowAll,
}: Props) {
  const isOtherMonth = date.getMonth() !== currentMonth;
  const isToday = isSameDay(date, new Date());

  const dayStart = new Date(date);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(date);
  dayEnd.setHours(23, 59, 59, 999);

  const key = dateKey(date);

  const dayEvents = events
    .filter((e) => {
      if (e.allDay) {
        const { startDate, endDate } = allDayDates(e);
        return startDate <= key && key <= endDate;
      }
      const s = new Date(e.startTime);
      const en = new Date(e.endTime);
      return s <= dayEnd && en >= dayStart;
    })
    .sort((a, b) => {
      if (a.allDay && !b.allDay) return -1;
      if (!a.allDay && b.allDay) return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

  const visible = dayEvents.slice(0, MAX_VISIBLE);
  const hiddenCount = dayEvents.length - visible.length;

  // Ячейка кликабельна только если есть право создавать события; тогда она доступна и с клавиатуры
  const interactive = onSelectDay
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': `Создать событие ${date.toLocaleDateString('ru-RU')}`,
        onClick: () => onSelectDay(date),
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelectDay(date);
          }
        },
      }
    : {};

  return (
    <div
      className={`day-cell ${isOtherMonth ? 'day-cell--muted' : ''} ${isToday ? 'day-cell--today' : ''}`}
      {...interactive}
    >
      <span className="day-cell__number">{date.getDate()}</span>
      <div className="day-cell__events">
        {visible.map((event) => (
          <button
            type="button"
            key={event.id}
            className={`event-chip ${event.allDay ? 'event-chip--allday' : ''}`}
            style={{ backgroundColor: event.color }}
            onClick={(e) => {
              e.stopPropagation();
              onSelectEvent(event);
            }}
            title={`${event.allDay ? 'весь день' : formatTime(event.startTime)} · ${event.title}`}
          >
            {event.allDay ? (
              event.title
            ) : (
              <>
                <span className="event-chip__time">{formatTime(event.startTime)}</span>
                {event.title}
              </>
            )}
          </button>
        ))}
        {hiddenCount > 0 && (
          <button
            type="button"
            className="event-chip event-chip--more"
            onClick={(e) => {
              e.stopPropagation();
              onShowAll(date, dayEvents);
            }}
          >
            ещё {hiddenCount}
          </button>
        )}
      </div>
    </div>
  );
}