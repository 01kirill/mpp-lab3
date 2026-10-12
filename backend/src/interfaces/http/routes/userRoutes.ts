import { RequestHandler, Router } from 'express';
import { UserController } from '../controllers/UserController';
import { validate } from '../middlewares/validate';
import { requireRole } from '../middlewares/auth';
import { changeRoleSchema, setActiveSchema } from '../validators/authValidator';

export function createUserRouter(controller: UserController, auth: RequestHandler): Router {
  const router = Router();

  router.use(auth, requireRole('admin'));

  router.get('/', controller.list);
  router.patch('/:id/role', validate(changeRoleSchema), controller.changeRole);
  router.patch('/:id/active', validate(setActiveSchema), controller.setActive);
  router.get('/sessions', controller.listSessions);
  router.delete('/sessions/:id', controller.revokeSession);

  return router;
}
