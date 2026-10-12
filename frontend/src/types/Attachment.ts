export interface Attachment {
  id: string;
  eventId: string;
  originalName: string;
  storedName: string;
  mimeType: string | null;
  sizeBytes: number;
  uploadedAt: string;
}