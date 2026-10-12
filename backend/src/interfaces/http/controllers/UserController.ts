import { Request, Response, NextFunction } from 'express';
import { ListUsersUseCase } from '../../../application/use-cases/users/ListUsers';
import { ChangeUserRoleUseCase } from '../../../application/use-cases/users/ChangeUserRole';
import { SetUserActiveUseCase } from '../../../application/use-cases/users/SetUserActive';
import { ListActiveSessionsUseCase } from '../../../application/use-cases/users/ListActiveSessions';
import { RevokeSessionUseCase } from '../../../application/use-cases/users/RevokeSession';

export class UserController {
  constructor(
    private listUsersUC: ListUsersUseCase,
    private changeRoleUC: ChangeUserRoleUseCase,
    private setActiveUC: SetUserActiveUseCase,
    private listSessionsUC: ListActiveSessionsUseCase,
    private revokeSessionUC: RevokeSessionUseCase
  ) {}

  list = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.listUsersUC.execute()); } catch (e) { next(e); }
  };

  changeRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.changeRoleUC.execute(req.params.id, req.body.role, req.auth!.id);
      res.json(result);
    } catch (e) { next(e); }
  };

  setActive = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.setActiveUC.execute(req.params.id, req.body.isActive, req.auth!.id);
      res.json(result);
    } catch (e) { next(e); }
  };

  listSessions = async (_req: Request, res: Response, next: NextFunction) => {
    try { res.json(await this.listSessionsUC.execute()); } catch (e) { next(e); }
  };

  revokeSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.revokeSessionUC.execute(req.params.id);
      res.status(204).send();
    } catch (e) { next(e); }
  };
}