import winston from 'winston';
import path from 'path';
import { loggerConfig, appConfig } from '../config';

const { combine, timestamp, errors, json, colorize, printf, metadata } = winston.format;

const prettyFormat = combine(
  colorize({ all: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? `\n  ${JSON.stringify(meta, null, 2)}` : '';
    const stackStr = stack ? `\n${stack}` : '';
    return `[${ts}] ${level}: ${message}${metaStr}${stackStr}`;
  }),
);

const jsonFormat = combine(
  timestamp(),
  errors({ stack: true }),
  metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
  json(),
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: appConfig.isDevelopment ? prettyFormat : jsonFormat,
    silent: appConfig.isTest,
  }),
];

if (loggerConfig.file.enabled && !appConfig.isTest) {
  transports.push(
    new winston.transports.File({
      filename: path.join(loggerConfig.dir, 'error.log'),
      level: 'error',
      format: jsonFormat,
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 14,
    }),
    new winston.transports.File({
      filename: path.join(loggerConfig.dir, 'combined.log'),
      format: jsonFormat,
      maxsize: 20 * 1024 * 1024,
      maxFiles: 14,
    }),
  );
}

export const logger = winston.createLogger({
  level: loggerConfig.level,
  transports,
  exitOnError: false,
});

export const createChildLogger = (context: string, meta?: Record<string, unknown>) =>
  logger.child({ context, ...meta });

export default logger;
