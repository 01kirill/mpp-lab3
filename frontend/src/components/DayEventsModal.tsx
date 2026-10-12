import { CalendarEvent } from '../types/Event';
import { Modal } from './Modal';

interface Props {
  date: Date;
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onClose: () => void;
}

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

function pluralEvents(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} событие`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} события`;
  return `${n} событий`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function DayEventsModal({ date, events, onSelectEvent, onClose }: Props) {
  const title = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;

  return (
    <Modal onClose={onClose}>
      <h2 className="day-modal__title">{title}</h2>
      <p className="day-modal__subtitle">{pluralEvents(events.length)}</p>
      <ul className="day-modal__list">
        {events.map((event) => (
          <li key={event.id}>
            <button
              type="button"
              className="day-modal__item"
              onClick={() => onSelectEvent(event)}
            >
              <span
                className="day-modal__dot"
                style={{ backgroundColor: event.color }}
              />
              <span className="day-modal__time">
                {event.allDay ? 'весь день' : formatTime(event.startTime)}
              </span>
              <span className="day-modal__name">{event.title}</span>
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}