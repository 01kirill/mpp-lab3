import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { IAttachmentRepository } from '../../domain/repositories/IAttachmentRepository';
import { Actor } from '../../domain/entities/User';
import { assertCanWrite } from '../policies/eventAccess';
import { RemoveFile } from '../services/FileStorage';

export class DeleteEventUseCase {
  constructor(
    private eventRepository: IEventRepository,
    private attachmentRepository: IAttachmentRepository,
    private removeFile: RemoveFile
  ) {}

  async execute(id: string, actor: Actor): Promise<void> {
    assertCanWrite(await this.eventRepository.findById(id), actor);
    // Строки attachments удалит каскад, файлы на диске — только мы
    const attachments = await this.attachmentRepository.findByEventId(id);
    await this.eventRepository.delete(id);
    await Promise.all(attachments.map((a) => this.removeFile(a.storedName)));
  }
}
