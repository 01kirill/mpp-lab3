export interface CalendarEvent {
  id: string;
  userId: string | null;
  /** email владельца — для admin и viewer, которые видят чужие события */
  ownerEmail: string | null;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewCalendarEvent {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: string;
  endTime: string;
  allDay?: boolean;
  color?: string;
}

export type UpdateCalendarEvent = Partial<NewCalendarEvent> & {
  /** updatedAt события, которое редактировал клиент; не совпадает — кто-то успел изменить событие раньше */
  expectedUpdatedAt?: string;
};
