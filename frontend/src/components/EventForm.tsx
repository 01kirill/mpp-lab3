import { FormEvent, useState } from 'react';
import { CalendarEvent, EventFormData } from '../types/Event';
import { AttachmentList } from './AttachmentList';
import { allDayBounds, allDayDates, dateKey } from '../utils/date';

interface Props {
  initialDate?: Date;
  event?: CalendarEvent;
  /** Только просмотр (роль viewer) */
  readOnly?: boolean;
  /** Показать автора — когда событие чужое (видят admin и viewer) */
  ownerEmail?: string | null;
  onSubmit: (data: EventFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}

const COLORS = ['#4285f4', '#ea4335', '#34a853', '#fbbc04', '#9c27b0', '#00acc1'];

function toDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${dateKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Новое событие на выбранный день по умолчанию занимает 09:00–10:00 */
function defaultRange(day: Date): [Date, Date] {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9);
  return [start, new Date(start.getTime() + 60 * 60 * 1000)];
}

/** Начальные значения полей в формате datetime-local */
function initialValues(event: CalendarEvent | undefined, initialDate: Date | undefined): [string, string] {
  if (event?.allDay) {
    // Дата all-day события не зависит от пояса; время 09:00–10:00 — на случай снятия флажка
    const { startDate, endDate } = allDayDates(event);
    return [`${startDate}T09:00`, `${endDate}T10:00`];
  }
  const [start, end] = event
    ? [new Date(event.startTime), new Date(event.endTime)]
    : defaultRange(initialDate ?? new Date());
  return [toDateTimeLocal(start), toDateTimeLocal(end)];
}

export function EventForm({ initialDate, event, readOnly = false, ownerEmail, onSubmit, onDelete, onClose }: Props) {
  const [initialStart, initialEnd] = initialValues(event, initialDate);

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');

  const [startValue, setStartValue] = useState(initialStart);
  const [endValue, setEndValue] = useState(initialEnd);

  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [color, setColor] = useState(event?.color ?? COLORS[0]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const startForInput = allDay ? startValue.slice(0, 10) : startValue;
  const endForInput = allDay ? endValue.slice(0, 10) : endValue;

  const handleAllDayChange = (checked: boolean) => {
    setAllDay(checked);
    if (checked) {
      setStartValue(startValue.slice(0, 10));
      setEndValue(endValue.slice(0, 10));
    } else {
      setStartValue(`${startValue.slice(0, 10)}T09:00`);
      setEndValue(`${endValue.slice(0, 10)}T10:00`);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Введите название события');
      return;
    }

    let startIso: string;
    let endIso: string;

    if (allDay) {
      ({ startTime: startIso, endTime: endIso } = allDayBounds(startValue.slice(0, 10), endValue.slice(0, 10)));
    } else {
      startIso = new Date(startValue).toISOString();
      endIso = new Date(endValue).toISOString();
    }

    if (new Date(startIso) >= new Date(endIso)) {
      setFormError('Дата начала должна быть раньше даты окончания');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startTime: startIso,
        endTime: endIso,
        allDay,
        color,
        expectedUpdatedAt: event?.updatedAt,
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось сохранить событие');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !confirm('Удалить событие?')) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await onDelete();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Не удалось удалить событие');
      setSubmitting(false);
    }
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h2>{readOnly ? 'Событие' : event ? 'Редактировать событие' : 'Новое событие'}</h2>

      {ownerEmail && <p className="event-form__owner">Автор: {ownerEmail}</p>}

      {formError && <div className="alert alert--error">{formError}</div>}

      <fieldset className="event-form__fields" disabled={readOnly}>

        <label>
          Название *
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            required
          />
        </label>

        <label>
          Описание
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </label>

        <label>
          Место
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={255}
          />
        </label>

        <label className="event-form__checkbox">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => handleAllDayChange(e.target.checked)}
          />
          <span>Весь день</span>
        </label>

        <div className="event-form__row">
          <label>
            {allDay ? 'Дата начала' : 'Начало'}
            <input
              type={allDay ? 'date' : 'datetime-local'}
              value={startForInput}
              onChange={(e) => setStartValue(e.target.value)}
              required
            />
          </label>
          <label>
            {allDay ? 'Дата окончания' : 'Окончание'}
            <input
              type={allDay ? 'date' : 'datetime-local'}
              value={endForInput}
              onChange={(e) => setEndValue(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="event-form__colors">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              className={`color-dot ${color === c ? 'color-dot--selected' : ''}`}
              style={{ backgroundColor: c }}
              onClick={() => setColor(c)}
              aria-label={`Цвет ${c}`}
            />
          ))}
        </div>
      </fieldset>

      {event ? (
        <AttachmentList eventId={event.id} readOnly={readOnly} />
      ) : (
        <p className="attachments__hint">
          💡 Сохраните событие, чтобы добавить вложения
        </p>
      )}

      <div className="event-form__actions">
        {event && onDelete && !readOnly && (
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={submitting}
          >
            Удалить
          </button>
        )}
        <div className="event-form__actions-right">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            disabled={submitting}
          >
            {readOnly ? 'Закрыть' : 'Отмена'}
          </button>
          {!readOnly && (
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting}
            >
              {submitting ? 'Сохранение...' : 'Сохранить'}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}