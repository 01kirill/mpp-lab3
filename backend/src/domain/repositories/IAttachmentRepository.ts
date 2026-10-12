import { Attachment, NewAttachment } from '../entities/Attachment';

export interface IAttachmentRepository {
  findByEventId(eventId: string): Promise<Attachment[]>;
  findById(id: string): Promise<Attachment | null>;
  create(data: NewAttachment): Promise<Attachment>;
  delete(id: string): Promise<boolean>;
}