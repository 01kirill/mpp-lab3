import { IAttachmentRepository } from '../../../domain/repositories/IAttachmentRepository';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { Attachment } from '../../../domain/entities/Attachment';
import { Actor } from '../../../domain/entities/User';
import { NotFoundError } from '../../errors/AppError';
import { assertCanRead } from '../../policies/eventAccess';

export class GetAttachmentUseCase {
  constructor(private attachmentRepository: IAttachmentRepository, private eventRepository: IEventRepository) {}

  async execute(id: string, actor: Actor): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) throw new NotFoundError('Вложение не найдено');
    assertCanRead(await this.eventRepository.findById(attachment.eventId), actor);
    return attachment;
  }
}
