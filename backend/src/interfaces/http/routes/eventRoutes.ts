import { RequestHandler, Router } from 'express';
import { EventController } from '../controllers/EventController';
import { AttachmentController } from '../controllers/AttachmentController';
import { validate } from '../middlewares/validate';
import { upload } from '../middlewares/upload';
import { requireRole } from '../middlewares/auth';
import { createEventSchema, eventsQuerySchema, updateEventSchema } from '../validators/eventValidator';

const canWrite = requireRole('admin', 'editor');

export function createEventRouter(
  auth: RequestHandler,
  events: EventController,
  attachments: AttachmentController
): Router {
  const router = Router();
  router.use(auth);

  router.get('/', validate(eventsQuerySchema, 'query'), events.getAll);
  router.get('/:id', events.getById);
  router.post('/', canWrite, validate(createEventSchema), events.create);
  router.put('/:id', canWrite, validate(updateEventSchema), events.update);
  router.delete('/:id', canWrite, events.delete);

  router.get('/:id/attachments', attachments.listByEvent);
  router.post('/:id/attachments', canWrite, upload.single('file'), attachments.upload);

  return router;
}

export function createAttachmentRouter(auth: RequestHandler, attachments: AttachmentController): Router {
  const router = Router();
  router.use(auth);
  router.get('/:id/download', attachments.download);
  router.delete('/:id', canWrite, attachments.delete);
  return router;
}
