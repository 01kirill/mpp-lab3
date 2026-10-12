import { IAttachmentRepository } from '../../../domain/repositories/IAttachmentRepository';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { Actor } from '../../../domain/entities/User';
import { NotFoundError } from '../../errors/AppError';
import { assertCanWrite } from '../../policies/eventAccess';
import { RemoveFile } from '../../services/FileStorage';

export class DeleteAttachmentUseCase {
  constructor(
    private attachmentRepository: IAttachmentRepository,
    private eventRepository: IEventRepository,
    private removeFile: RemoveFile
  ) {}

  async execute(id: string, actor: Actor): Promise<void> {
    const attachment = await this.attachmentRepository.findById(id);
    if (!attachment) throw new NotFoundError('Вложение не найдено');
    assertCanWrite(await this.eventRepository.findById(attachment.eventId), actor);
    await this.attachmentRepository.delete(id);
    await this.removeFile(attachment.storedName);
  }
}
