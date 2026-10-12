import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { createEventRouter, createAttachmentRouter } from './interfaces/http/routes/eventRoutes';
import { createAuthRouter } from './interfaces/http/routes/authRoutes';
import { createUserRouter } from './interfaces/http/routes/userRoutes';
import { errorHandler, notFoundHandler } from './interfaces/http/middlewares/errorHandler';
import { requestLogger } from './interfaces/http/middlewares/requestLogger';
import { authMiddleware } from './interfaces/http/middlewares/auth';
import { removeUploadedFile } from './interfaces/http/middlewares/upload';
import { env } from './config/env';
import { appLogger } from './infrastructure/logging/logger';
import { TokenService } from './application/services/TokenService';
import { PasswordService } from './application/services/PasswordService';
import { AuthAuditService } from './application/services/AuthAuditService';
import { SmtpEmailService } from './infrastructure/email/SmtpEmailService';
import { PostgresUserRepository } from './infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from './infrastructure/repositories/PostgresSessionRepository';
import { PostgresPasswordResetRepository } from './infrastructure/repositories/PostgresPasswordResetRepository';
import { PostgresEventRepository } from './infrastructure/repositories/PostgresEventRepository';
import { PostgresAttachmentRepository } from './infrastructure/repositories/PostgresAttachmentRepository';
import { AuthController } from './interfaces/http/controllers/AuthController';
import { UserController } from './interfaces/http/controllers/UserController';
import { EventController } from './interfaces/http/controllers/EventController';
import { AttachmentController } from './interfaces/http/controllers/AttachmentController';
import { RegisterUserUseCase } from './application/use-cases/auth/RegisterUser';
import { LoginUserUseCase } from './application/use-cases/auth/LoginUser';
import { RefreshSessionUseCase } from './application/use-cases/auth/RefreshSession';
import { LogoutUserUseCase } from './application/use-cases/auth/LogoutUser';
import { RequestPasswordResetUseCase } from './application/use-cases/auth/RequestPasswordReset';
import { ResetPasswordUseCase } from './application/use-cases/auth/ResetPassword';
import { GetCurrentUserUseCase } from './application/use-cases/auth/GetCurrentUser';
import { ListUsersUseCase } from './application/use-cases/users/ListUsers';
import { ChangeUserRoleUseCase } from './application/use-cases/users/ChangeUserRole';
import { SetUserActiveUseCase } from './application/use-cases/users/SetUserActive';
import { ListActiveSessionsUseCase } from './application/use-cases/users/ListActiveSessions';
import { RevokeSessionUseCase } from './application/use-cases/users/RevokeSession';
import { CreateEventUseCase } from './application/use-cases/CreateEvent';
import { GetEventsUseCase } from './application/use-cases/GetEvents';
import { GetEventByIdUseCase } from './application/use-cases/GetEventById';
import { UpdateEventUseCase } from './application/use-cases/UpdateEvent';
import { DeleteEventUseCase } from './application/use-cases/DeleteEvent';
import { ListAttachmentsUseCase } from './application/use-cases/attachments/ListAttachments';
import { GetAttachmentUseCase } from './application/use-cases/attachments/GetAttachment';
import { UploadAttachmentUseCase } from './application/use-cases/attachments/UploadAttachment';
import { DeleteAttachmentUseCase } from './application/use-cases/attachments/DeleteAttachment';

/** Composition root: здесь создаются все зависимости приложения */
export function createApp() {
  const app = express();

  app.set('trust proxy', env.trustProxy);
  app.use(helmet());
  app.use(cors({
    origin: env.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestLogger(appLogger));

  const userRepo = new PostgresUserRepository();
  const sessionRepo = new PostgresSessionRepository();
  const resetRepo = new PostgresPasswordResetRepository();
  const eventRepo = new PostgresEventRepository();
  const attachmentRepo = new PostgresAttachmentRepository();
  const tokenService = new TokenService();
  const passwordService = new PasswordService();
  const audit = new AuthAuditService(appLogger);
  const emailService = new SmtpEmailService(appLogger);
  const auth = authMiddleware(tokenService, sessionRepo);

  const authController = new AuthController(
    new RegisterUserUseCase(userRepo, passwordService),
    new LoginUserUseCase(userRepo, sessionRepo, passwordService, tokenService, audit),
    new RefreshSessionUseCase(sessionRepo, tokenService, audit),
    new LogoutUserUseCase(sessionRepo, tokenService, audit),
    new RequestPasswordResetUseCase(userRepo, resetRepo, tokenService, emailService, audit, env.appUrl),
    new ResetPasswordUseCase(resetRepo, userRepo, sessionRepo, passwordService, tokenService, audit),
    new GetCurrentUserUseCase(userRepo),
    tokenService.refreshTtlMs()
  );

  const userController = new UserController(
    new ListUsersUseCase(userRepo),
    new ChangeUserRoleUseCase(userRepo),
    new SetUserActiveUseCase(userRepo, sessionRepo),
    new ListActiveSessionsUseCase(sessionRepo),
    new RevokeSessionUseCase(sessionRepo)
  );

  const eventController = new EventController(
    new CreateEventUseCase(eventRepo),
    new GetEventsUseCase(eventRepo),
    new GetEventByIdUseCase(eventRepo),
    new UpdateEventUseCase(eventRepo),
    new DeleteEventUseCase(eventRepo, attachmentRepo, removeUploadedFile)
  );

  const attachmentController = new AttachmentController(
    new ListAttachmentsUseCase(attachmentRepo, eventRepo),
    new GetAttachmentUseCase(attachmentRepo, eventRepo),
    new UploadAttachmentUseCase(attachmentRepo, eventRepo, removeUploadedFile),
    new DeleteAttachmentUseCase(attachmentRepo, eventRepo, removeUploadedFile)
  );

  app.get('/api/health', (_req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/api/auth', createAuthRouter(authController, auth));
  app.use('/api/users', createUserRouter(userController, auth));
  app.use('/api/events', createEventRouter(auth, eventController, attachmentController));
  app.use('/api/attachments', createAttachmentRouter(auth, attachmentController));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
