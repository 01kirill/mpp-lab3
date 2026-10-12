import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { ListAttachmentsUseCase } from '../../../application/use-cases/attachments/ListAttachments';
import { GetAttachmentUseCase } from '../../../application/use-cases/attachments/GetAttachment';
import { UploadAttachmentUseCase } from '../../../application/use-cases/attachments/UploadAttachment';
import { DeleteAttachmentUseCase } from '../../../application/use-cases/attachments/DeleteAttachment';
import { UPLOAD_DIR, decodeOriginalName } from '../middlewares/upload';
import { NotFoundError, ValidationError } from '../../../application/errors/AppError';

export class AttachmentController {
  constructor(
    private listUseCase: ListAttachmentsUseCase,
    private getUseCase: GetAttachmentUseCase,
    private uploadUseCase: UploadAttachmentUseCase,
    private deleteUseCase: DeleteAttachmentUseCase
  ) {}

  listByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.listUseCase.execute(req.params.id, req.auth!));
    } catch (e) { next(e); }
  };

  upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new ValidationError('Файл не передан');
      const attachment = await this.uploadUseCase.execute(
        {
          eventId: req.params.id,
          originalName: decodeOriginalName(req.file.originalname),
          storedName: req.file.filename,
          mimeType: req.file.mimetype || null,
          sizeBytes: req.file.size,
        },
        req.auth!
      );
      res.status(201).json(attachment);
    } catch (e) { next(e); }
  };

  download = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const attachment = await this.getUseCase.execute(req.params.id, req.auth!);
      res.download(path.join(UPLOAD_DIR, path.basename(attachment.storedName)), attachment.originalName, (err) => {
        if (err && !res.headersSent) next(new NotFoundError('Файл не найден на диске'));
      });
    } catch (e) { next(e); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteUseCase.execute(req.params.id, req.auth!);
      res.status(204).send();
    } catch (e) { next(e); }
  };
}
