import { Request, Response, NextFunction } from 'express';
import { CreateEventUseCase } from '../../../application/use-cases/CreateEvent';
import { GetEventsUseCase } from '../../../application/use-cases/GetEvents';
import { GetEventByIdUseCase } from '../../../application/use-cases/GetEventById';
import { UpdateEventUseCase } from '../../../application/use-cases/UpdateEvent';
import { DeleteEventUseCase } from '../../../application/use-cases/DeleteEvent';

export class EventController {
  constructor(
    private createEventUseCase: CreateEventUseCase,
    private getEventsUseCase: GetEventsUseCase,
    private getEventByIdUseCase: GetEventByIdUseCase,
    private updateEventUseCase: UpdateEventUseCase,
    private deleteEventUseCase: DeleteEventUseCase
  ) {}

  getAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { rangeStart, rangeEnd } = req.query as { rangeStart?: string; rangeEnd?: string };
      res.status(200).json(await this.getEventsUseCase.execute(req.auth!, rangeStart, rangeEnd));
    } catch (e) { next(e); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.getEventByIdUseCase.execute(req.params.id, req.auth!));
    } catch (e) { next(e); }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await this.createEventUseCase.execute(req.auth!.id, req.body));
    } catch (e) { next(e); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(200).json(await this.updateEventUseCase.execute(req.params.id, req.body, req.auth!));
    } catch (e) { next(e); }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.deleteEventUseCase.execute(req.params.id, req.auth!);
      res.status(204).send();
    } catch (e) { next(e); }
  };
}
