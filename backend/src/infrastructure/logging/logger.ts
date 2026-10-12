import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { env } from '../../config/env';

export interface ILogger {
  info(event: string, meta?: Record<string, unknown>): void;
  warn(event: string, meta?: Record<string, unknown>): void;
  error(event: string, meta?: Record<string, unknown>): void;
}

const level = env.logLevel;
const LOG_DIR = env.logDir || path.join(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}] ${message}${rest}`;
  })
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.nodeEnv === 'production' ? jsonFormat : consoleFormat,
  }),

  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: jsonFormat,
    level,
  }),

  new DailyRotateFile({
    dirname: LOG_DIR,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: jsonFormat,
    level: 'error',
  }),
];

const logger = winston.createLogger({
  level,
  defaultMeta: { service: 'calendar-backend' },
  transports,
});

export const appLogger: ILogger = {
  info: (event, meta = {}) => logger.info(event, meta),
  warn: (event, meta = {}) => logger.warn(event, meta),
  error: (event, meta = {}) => logger.error(event, meta),
};