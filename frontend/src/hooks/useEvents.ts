import { useCallback, useEffect, useState } from 'react';
import { CalendarEvent, EventFormData } from '../types/Event';
import { eventsApi } from '../api/eventsApi';

export function useEvents(rangeStart: string, rangeEnd: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // При быстрой смене месяца прошлый запрос отменяется, чтобы его ответ не перезаписал новый
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    eventsApi
      .getAll(rangeStart, rangeEnd, controller.signal)
      .then(setEvents)
      .catch((e) => {
        if (controller.signal.aborted) return;
        setError(e instanceof Error ? e.message : 'Не удалось загрузить события');
        setEvents([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [rangeStart, rangeEnd]);

  const createEvent = useCallback(async (data: EventFormData) => {
    const created = await eventsApi.create(data);
    setEvents((prev) => [...prev, created]);
  }, []);

  const updateEvent = useCallback(async (id: string, data: EventFormData) => {
    const updated = await eventsApi.update(id, data);
    setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await eventsApi.delete(id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { events, loading, error, clearError, createEvent, updateEvent, deleteEvent };
}
