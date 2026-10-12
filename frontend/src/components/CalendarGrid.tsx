import { CalendarEvent } from '../types/Event';
import { getMonthGrid } from '../utils/date';
import { DayCell } from './DayCell';

interface Props {
  currentDate: Date;
  events: CalendarEvent[];
  onSelectDay?: (date: Date) => void;
  onSelectEvent: (event: CalendarEvent) => void;
  onShowAll: (date: Date, events: CalendarEvent[]) => void;
}

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export function CalendarGrid({
  currentDate,
  events,
  onSelectDay,
  onSelectEvent,
  onShowAll,
}: Props) {
  const days = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());

  return (
    <div className="calendar-grid">
      <div className="calendar-grid__weekdays">
        {WEEKDAYS.map((d) => (
          <div key={d} className="calendar-grid__weekday">{d}</div>
        ))}
      </div>
      <div className="calendar-grid__days">
        {days.map((date) => (
          <DayCell
            key={date.toISOString()}
            date={date}
            currentMonth={currentDate.getMonth()}
            events={events}
            onSelectDay={onSelectDay}
            onSelectEvent={onSelectEvent}
            onShowAll={onShowAll}
          />
        ))}
      </div>
    </div>
  );
}