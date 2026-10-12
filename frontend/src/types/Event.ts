export interface CalendarEvent {
  id: string;
  userId: string | null;
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

export interface EventFormData {
  title: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  allDay: boolean;
  color: string;
  /** Только при обновлении: защита от перезаписи чужих изменений */
  expectedUpdatedAt?: string;
}
