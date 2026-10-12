import { CalendarEvent, EventFormData } from '../types/Event';
import { json, request } from './http';

export const eventsApi = {
  getAll(rangeStart: string, rangeEnd: string, signal?: AbortSignal): Promise<CalendarEvent[]> {
    const params = new URLSearchParams({ rangeStart, rangeEnd });
    return request<CalendarEvent[]>(`/events?${params}`, { signal });
  },
  create: (data: EventFormData) => request<CalendarEvent>('/events', json('POST', data)),
  update: (id: string, data: EventFormData) => request<CalendarEvent>(`/events/${id}`, json('PUT', data)),
  delete: (id: string) => request<void>(`/events/${id}`, { method: 'DELETE' }),
};
