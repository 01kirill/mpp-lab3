import { IAttachmentRepository } from '../../../domain/repositories/IAttachmentRepository';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { Attachment } from '../../../domain/entities/Attachment';
import { Actor } from '../../../domain/entities/User';
import { assertCanRead } from '../../policies/eventAccess';

export class ListAttachmentsUseCase {
  constructor(private attachmentRepository: IAttachmentRepository, private eventRepository: IEventRepository) {}

  async execute(eventId: string, actor: Actor): Promise<Attachment[]> {
    assertCanRead(await this.eventRepository.findById(eventId), actor);
    return this.attachmentRepository.findByEventId(eventId);
  }
}
