import { IAttachmentRepository } from '../../../domain/repositories/IAttachmentRepository';
import { IEventRepository } from '../../../domain/repositories/IEventRepository';
import { Attachment, NewAttachment } from '../../../domain/entities/Attachment';
import { Actor } from '../../../domain/entities/User';
import { assertCanWrite } from '../../policies/eventAccess';
import { RemoveFile } from '../../services/FileStorage';

export class UploadAttachmentUseCase {
  constructor(
    private attachmentRepository: IAttachmentRepository,
    private eventRepository: IEventRepository,
    private removeFile: RemoveFile
  ) {}

  /** Файл уже сохранён на диск; при любой ошибке он удаляется, чтобы не оставалось сирот */
  async execute(data: NewAttachment, actor: Actor): Promise<Attachment> {
    try {
      assertCanWrite(await this.eventRepository.findById(data.eventId), actor);
      return await this.attachmentRepository.create(data);
    } catch (e) {
      await this.removeFile(data.storedName);
      throw e;
    }
  }
}
