import { useMemo, useState } from 'react';
import { CalendarEvent } from '../types/Event';
import { useEvents } from '../hooks/useEvents';
import { useAuth } from '../auth/AuthContext';
import { CalendarHeader } from './CalendarHeader';
import { CalendarGrid } from './CalendarGrid';
import { Modal } from './Modal';
import { EventForm } from './EventForm';
import { ErrorBanner } from './ErrorBanner';
import { DayEventsModal } from './DayEventsModal';
import { getMonthGrid } from '../utils/date';

type ModalState =
  | { mode: 'create'; date: Date }
  | { mode: 'edit'; event: CalendarEvent }
  | null;

type DayModalState = { date: Date; events: CalendarEvent[] } | null;

export function CalendarPage() {
  const { user } = useAuth();
  const readOnly = user?.role === 'viewer';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modal, setModal] = useState<ModalState>(null);
  const [dayModal, setDayModal] = useState<DayModalState>(null);

  const { rangeStart, rangeEnd } = useMemo(() => {
    const grid = getMonthGrid(currentDate.getFullYear(), currentDate.getMonth());
    const last = grid[grid.length - 1];
    // Конец диапазона — начало дня ПОСЛЕ последней клетки, иначе события последнего дня теряются
    const end = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
    return { rangeStart: grid[0].toISOString(), rangeEnd: end.toISOString() };
  }, [currentDate]);

  const { events, loading, error, clearError, createEvent, updateEvent, deleteEvent } = useEvents(rangeStart, rangeEnd);

  const goToPrevMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const goToNextMonth = () => setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());
  const changeMonth = (m: number) => setCurrentDate((d) => new Date(d.getFullYear(), m, 1));
  const changeYear = (y: number) => setCurrentDate((d) => new Date(y, d.getMonth(), 1));

  /** «+ Событие»: сегодня, если открыт текущий месяц, иначе 1-е число открытого месяца */
  const defaultCreateDate = () => {
    const today = new Date();
    const sameMonth = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth();
    return sameMonth ? today : new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  };

  const closeModal = () => setModal(null);

  return (
    <div className="app">
      <CalendarHeader
        currentDate={currentDate}
        onPrev={goToPrevMonth}
        onNext={goToNextMonth}
        onToday={goToToday}
        onCreate={readOnly ? undefined : () => setModal({ mode: 'create', date: defaultCreateDate() })}
        onChangeMonth={changeMonth}
        onChangeYear={changeYear}
      />
      {error && <ErrorBanner message={error} onDismiss={clearError} />}
      {loading && <div className="loading-bar" />}
      <CalendarGrid
        currentDate={currentDate}
        events={events}
        onSelectDay={readOnly ? undefined : (date) => setModal({ mode: 'create', date })}
        onSelectEvent={(event) => setModal({ mode: 'edit', event })}
        onShowAll={(date, dayEvents) => setDayModal({ date, events: dayEvents })}
      />
      {dayModal && (
        <DayEventsModal
          date={dayModal.date}
          events={dayModal.events}
          onSelectEvent={(e) => { setDayModal(null); setModal({ mode: 'edit', event: e }); }}
          onClose={() => setDayModal(null)}
        />
      )}
      {modal && (
        <Modal onClose={closeModal}>
          {modal.mode === 'create' ? (
            <EventForm
              initialDate={modal.date}
              onSubmit={async (data) => { await createEvent(data); closeModal(); }}
              onClose={closeModal}
            />
          ) : (
            <EventForm
              event={modal.event}
              readOnly={readOnly}
              ownerEmail={modal.event.userId !== user?.id ? modal.event.ownerEmail : null}
              onSubmit={async (data) => { await updateEvent(modal.event.id, data); closeModal(); }}
              onDelete={async () => { await deleteEvent(modal.event.id); closeModal(); }}
              onClose={closeModal}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
