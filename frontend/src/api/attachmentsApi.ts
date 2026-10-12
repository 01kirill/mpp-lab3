import { Attachment } from '../types/Attachment';
import { apiFetch, request } from './http';

export const attachmentsApi = {
  listByEvent: (eventId: string) => request<Attachment[]>(`/events/${eventId}/attachments`),

  upload(eventId: string, file: File): Promise<Attachment> {
    const fd = new FormData();
    fd.append('file', file);
    return request<Attachment>(`/events/${eventId}/attachments`, { method: 'POST', body: fd });
  },

  delete: (id: string) => request<void>(`/attachments/${id}`, { method: 'DELETE' }),

  async download(id: string): Promise<Blob> {
    return (await apiFetch(`/attachments/${id}/download`)).blob();
  },
};
