const fs = require('fs');
const path = require('path');

const baseDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\scratch\\flowforge\\server';

const files = {
  'package.json': `{
  "name": "flowforge-server",
  "version": "1.0.0",
  "description": "Event-Driven Workflow Automation Platform",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "prisma db seed",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "bcrypt": "^5.1.1",
    "bullmq": "^4.12.0",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "helmet": "^7.0.0",
    "ioredis": "^5.3.2",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.7.2",
    "winston": "^3.11.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.0",
    "@types/compression": "^1.7.2",
    "@types/cors": "^2.8.13",
    "@types/express": "^4.17.17",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/node": "^20.5.9",
    "nodemon": "^3.0.1",
    "prisma": "^5.0.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.2.2"
  }
}`,
  'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@config/*": ["src/config/*"],
      "@modules/*": ["src/modules/*"],
      "@middleware/*": ["src/middleware/*"],
      "@shared/*": ["src/shared/*"],
      "@services/*": ["src/services/*"],
      "@utils/*": ["src/utils/*"],
      "@events/*": ["src/events/*"],
      "@websocket/*": ["src/websocket/*"],
      "@database/*": ["src/database/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}`,
  'Dockerfile': `FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npm run prisma:generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["npm", "start"]`,
  '.dockerignore': `node_modules
dist
npm-debug.log
.env
.git
.gitignore
*.md`,
  '.env.example': `NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://user:password@localhost:5432/flowforge?schema=public"
REDIS_URL="redis://localhost:6379"
BULL_REDIS_URL="redis://localhost:6379"
JWT_SECRET="supersecretjwtkey"
JWT_REFRESH_SECRET="supersecretjwtrefreshkey"
CORS_ORIGIN="*"
LOG_LEVEL="debug"`,
  'nodemon.json': `{
  "watch": ["src", ".env"],
  "ext": "ts",
  "exec": "ts-node src/server.ts"
}`,
  'prisma/schema.prisma': `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  USER
}

enum WorkflowStatus {
  DRAFT
  ACTIVE
  INACTIVE
}

enum ExecutionStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
  CANCELLED
}

enum StepStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}

enum JobStatus {
  ACTIVE
  PAUSED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  workflows Workflow[]
}

model Workflow {
  id          String   @id @default(uuid())
  name        String
  description String?
  definition  Json
  status      WorkflowStatus @default(DRAFT)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  executions  WorkflowExecution[]
  schedules   ScheduledJob[]
}

model WorkflowExecution {
  id          String   @id @default(uuid())
  workflowId  String
  workflow    Workflow @relation(fields: [workflowId], references: [id])
  status      ExecutionStatus @default(PENDING)
  startedAt   DateTime?
  completedAt DateTime?
  error       String?
  result      Json?
  triggeredBy String?
  steps       ExecutionStep[]
}

model ExecutionStep {
  id          String   @id @default(uuid())
  executionId String
  execution   WorkflowExecution @relation(fields: [executionId], references: [id])
  nodeId      String
  nodeType    String
  status      StepStatus @default(PENDING)
  input       Json?
  output      Json?
  error       String?
  startedAt   DateTime?
  completedAt DateTime?
  retryCount  Int      @default(0)
}

model AuditLog {
  id         String   @id @default(uuid())
  userId     String?
  action     String
  resource   String
  resourceId String?
  metadata   Json?
  createdAt  DateTime @default(now())
  ipAddress  String?
}

model ScheduledJob {
  id             String   @id @default(uuid())
  workflowId     String
  workflow       Workflow @relation(fields: [workflowId], references: [id])
  cronExpression String
  nextRunAt      DateTime?
  lastRunAt      DateTime?
  status         JobStatus @default(ACTIVE)
  createdAt      DateTime @default(now())
}
`
};

const srcFiles = {
  'src/config/index.ts': `export * from './app.config';
export * from './database.config';
export * from './redis.config';
export * from './auth.config';
export * from './queue.config';`,
  'src/config/app.config.ts': `export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info'
};`,
  'src/config/database.config.ts': `export const dbConfig = {
  url: process.env.DATABASE_URL || ''
};`,
  'src/config/redis.config.ts': `export const redisConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379'
};`,
  'src/config/auth.config.ts': `export const authConfig = {
  jwtSecret: process.env.JWT_SECRET || 'secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refreshsecret'
};`,
  'src/config/queue.config.ts': `export const queueConfig = {
  redisUrl: process.env.BULL_REDIS_URL || 'redis://localhost:6379'
};`,

  'src/database/index.ts': `export * from './prisma.client';`,
  'src/database/prisma.client.ts': `import { PrismaClient } from '@prisma/client';
export const prisma = new PrismaClient();`,

  'src/middleware/index.ts': `export * from './auth.middleware';
export * from './error-handler.middleware';
export * from './validate.middleware';
export * from './rate-limiter.middleware';
export * from './request-logger.middleware';
export * from './rbac.middleware';`,
  'src/middleware/auth.middleware.ts': `import { Request, Response, NextFunction } from 'express';
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // TODO: implement JWT verification logic
  next();
};`,
  'src/middleware/error-handler.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import { AppError } from '../shared/errors/app-error';
import { logger } from '../services/logger.service';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message, status: err.statusCode });
    return;
  }
  logger.error('Unexpected error', { error: err });
  res.status(500).json({ error: 'Internal Server Error', status: 500 });
};`,
  'src/middleware/validate.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../shared/errors/validation.error';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};`,
  'src/middleware/rate-limiter.middleware.ts': `import { Request, Response, NextFunction } from 'express';
export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  // TODO: implement rate limiting logic
  next();
};`,
  'src/middleware/request-logger.middleware.ts': `import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.info(\`\${req.method} \${req.originalUrl} \${res.statusCode} - \${ms}ms\`);
  });
  next();
};`,
  'src/middleware/rbac.middleware.ts': `import { Request, Response, NextFunction } from 'express';
export const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // TODO: implement role-based access logic
    next();
  };
};`,

  'src/shared/index.ts': `export * from './types';
export * from './errors';
export * from './constants';
export * from './interfaces';`,
  'src/shared/types/index.ts': `export * from './common.types';
export * from './express.d.ts';`,
  'src/shared/types/express.d.ts': `declare namespace Express {
  export interface Request {
    user?: any; // Replace with proper user type
  }
}`,
  'src/shared/types/common.types.ts': `export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}`,
  'src/shared/errors/index.ts': `export * from './app-error';
export * from './not-found.error';
export * from './unauthorized.error';
export * from './validation.error';
export * from './conflict.error';`,
  'src/shared/errors/app-error.ts': `export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}`,
  'src/shared/errors/not-found.error.ts': `import { AppError } from './app-error';
export class NotFoundError extends AppError {
  constructor(message = 'Not Found') {
    super(404, message);
  }
}`,
  'src/shared/errors/unauthorized.error.ts': `import { AppError } from './app-error';
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}`,
  'src/shared/errors/validation.error.ts': `import { AppError } from './app-error';
export class ValidationError extends AppError {
  constructor(message = 'Validation Error', public details?: any) {
    super(400, message);
  }
}`,
  'src/shared/errors/conflict.error.ts': `import { AppError } from './app-error';
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}`,
  'src/shared/constants/index.ts': `export * from './app.constants';`,
  'src/shared/constants/app.constants.ts': `export const AppConstants = {
  DEFAULT_PAGE_SIZE: 10
};`,
  'src/shared/interfaces/index.ts': `export * from './repository.interface';
export * from './service.interface';`,
  'src/shared/interfaces/repository.interface.ts': `export interface IRepository<T, ID> {
  findById(id: ID): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T>;
  delete(id: ID): Promise<boolean>;
}`,
  'src/shared/interfaces/service.interface.ts': `export interface IService<T, ID> {
  getById(id: ID): Promise<T>;
  getAll(): Promise<T[]>;
  create(item: Partial<T>): Promise<T>;
  update(id: ID, item: Partial<T>): Promise<T>;
  delete(id: ID): Promise<void>;
}`,

  'src/modules/auth/index.ts': `export * from './auth.routes';
export * from './auth.controller';
export * from './auth.service';
export * from './auth.repository';
export * from './auth.schema';
export * from './auth.types';`,
  'src/modules/auth/auth.controller.ts': `import { Request, Response, NextFunction } from 'express';
export class AuthController {
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    // TODO: implement logic
  }
}`,
  'src/modules/auth/auth.service.ts': `export class AuthService {
  // TODO: implement methods
}`,
  'src/modules/auth/auth.repository.ts': `export class AuthRepository {
  // TODO: implement methods
}`,
  'src/modules/auth/auth.routes.ts': `import { Router } from 'express';
const router = Router();
// TODO: map routes to controller
export const authRoutes = router;`,
  'src/modules/auth/auth.schema.ts': `import { z } from 'zod';
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6)
  })
});`,
  'src/modules/auth/auth.types.ts': `export interface AuthTokenPayload {
  userId: string;
  role: string;
}`,

  'src/modules/workflow/index.ts': `export * from './workflow.routes';
export * from './workflow.controller';
export * from './workflow.service';
export * from './workflow.repository';
export * from './workflow.schema';
export * from './workflow.types';`,
  'src/modules/workflow/workflow.controller.ts': `import { Request, Response, NextFunction } from 'express';
export class WorkflowController {
  // TODO: implement
}`,
  'src/modules/workflow/workflow.service.ts': `export class WorkflowService {
  // TODO: implement
}`,
  'src/modules/workflow/workflow.repository.ts': `export class WorkflowRepository {
  // TODO: implement
}`,
  'src/modules/workflow/workflow.routes.ts': `import { Router } from 'express';
const router = Router();
// TODO: define routes
export const workflowRoutes = router;`,
  'src/modules/workflow/workflow.schema.ts': `import { z } from 'zod';
export const createWorkflowSchema = z.object({});`,
  'src/modules/workflow/workflow.types.ts': `export interface WorkflowDto {}`,

  'src/modules/queue/index.ts': `export * from './queue.routes';
export * from './queue.controller';
export * from './queue.service';
export * from './queue.types';`,
  'src/modules/queue/queue.controller.ts': `export class QueueController {}`,
  'src/modules/queue/queue.service.ts': `export class QueueService {}`,
  'src/modules/queue/queue.routes.ts': `import { Router } from 'express';
const router = Router();
export const queueRoutes = router;`,
  'src/modules/queue/queue.types.ts': `export interface QueueType {}`,

  'src/modules/worker/index.ts': `export * from './worker.routes';
export * from './worker.controller';
export * from './worker.service';
export * from './worker.types';`,
  'src/modules/worker/worker.controller.ts': `export class WorkerController {}`,
  'src/modules/worker/worker.service.ts': `export class WorkerService {}`,
  'src/modules/worker/worker.routes.ts': `import { Router } from 'express';
const router = Router();
export const workerRoutes = router;`,
  'src/modules/worker/worker.types.ts': `export interface WorkerType {}`,

  'src/modules/scheduler/index.ts': `export * from './scheduler.routes';
export * from './scheduler.controller';
export * from './scheduler.service';
export * from './scheduler.types';`,
  'src/modules/scheduler/scheduler.controller.ts': `export class SchedulerController {}`,
  'src/modules/scheduler/scheduler.service.ts': `export class SchedulerService {}`,
  'src/modules/scheduler/scheduler.routes.ts': `import { Router } from 'express';
const router = Router();
export const schedulerRoutes = router;`,
  'src/modules/scheduler/scheduler.types.ts': `export interface SchedulerType {}`,

  'src/modules/analytics/index.ts': `export * from './analytics.routes';
export * from './analytics.controller';
export * from './analytics.service';
export * from './analytics.types';`,
  'src/modules/analytics/analytics.controller.ts': `export class AnalyticsController {}`,
  'src/modules/analytics/analytics.service.ts': `export class AnalyticsService {}`,
  'src/modules/analytics/analytics.routes.ts': `import { Router } from 'express';
const router = Router();
export const analyticsRoutes = router;`,
  'src/modules/analytics/analytics.types.ts': `export interface AnalyticsType {}`,

  'src/modules/notifications/index.ts': `export * from './notification.routes';
export * from './notification.controller';
export * from './notification.service';
export * from './notification.types';`,
  'src/modules/notifications/notification.controller.ts': `export class NotificationController {}`,
  'src/modules/notifications/notification.service.ts': `export class NotificationService {}`,
  'src/modules/notifications/notification.routes.ts': `import { Router } from 'express';
const router = Router();
export const notificationRoutes = router;`,
  'src/modules/notifications/notification.types.ts': `export interface NotificationType {}`,

  'src/modules/logs/index.ts': `export * from './logs.routes';
export * from './logs.controller';
export * from './logs.service';
export * from './logs.types';`,
  'src/modules/logs/logs.controller.ts': `export class LogsController {}`,
  'src/modules/logs/logs.service.ts': `export class LogsService {}`,
  'src/modules/logs/logs.routes.ts': `import { Router } from 'express';
const router = Router();
export const logsRoutes = router;`,
  'src/modules/logs/logs.types.ts': `export interface LogsType {}`,

  'src/modules/dashboard/index.ts': `export * from './dashboard.routes';
export * from './dashboard.controller';
export * from './dashboard.service';
export * from './dashboard.types';`,
  'src/modules/dashboard/dashboard.controller.ts': `export class DashboardController {}`,
  'src/modules/dashboard/dashboard.service.ts': `export class DashboardService {}`,
  'src/modules/dashboard/dashboard.routes.ts': `import { Router } from 'express';
const router = Router();
export const dashboardRoutes = router;`,
  'src/modules/dashboard/dashboard.types.ts': `export interface DashboardType {}`,

  'src/services/index.ts': `export * from './redis.service';
export * from './logger.service';
export * from './email.service';
export * from './cache.service';`,
  'src/services/redis.service.ts': `import Redis from 'ioredis';
import { redisConfig } from '../config';

class RedisService {
  private static instance: RedisService;
  public client: Redis;

  private constructor() {
    this.client = new Redis(redisConfig.url);
  }

  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }
}
export const redisService = RedisService.getInstance();`,
  'src/services/logger.service.ts': `import winston from 'winston';
import { appConfig } from '../config';

export const logger = winston.createLogger({
  level: appConfig.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});`,
  'src/services/email.service.ts': `export class EmailService {
  // TODO: implement
}`,
  'src/services/cache.service.ts': `export class CacheService {
  // TODO: implement
}`,

  'src/utils/index.ts': `export * from './helpers';
export * from './crypto.util';
export * from './token.util';`,
  'src/utils/helpers.ts': `export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));`,
  'src/utils/crypto.util.ts': `import bcrypt from 'bcrypt';
export class CryptoUtil {
  static async hash(data: string): Promise<string> {
    return bcrypt.hash(data, 10);
  }
  static async compare(data: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}`,
  'src/utils/token.util.ts': `import jwt from 'jsonwebtoken';
import { authConfig } from '../config';

export class TokenUtil {
  static generate(payload: any, expiresIn: string = '1h'): string {
    return jwt.sign(payload, authConfig.jwtSecret, { expiresIn });
  }
  static verify(token: string): any {
    return jwt.verify(token, authConfig.jwtSecret);
  }
}`,

  'src/events/index.ts': `export * from './event-emitter';
export * from './event.types';`,
  'src/events/event-emitter.ts': `import { EventEmitter } from 'events';
export const appEventEmitter = new EventEmitter();`,
  'src/events/event.types.ts': `export enum AppEvents {
  WORKFLOW_STARTED = 'WORKFLOW_STARTED',
  WORKFLOW_COMPLETED = 'WORKFLOW_COMPLETED'
}`,

  'src/websocket/index.ts': `export * from './socket.server';
export * from './socket.handlers';`,
  'src/websocket/socket.server.ts': `import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { registerHandlers } from './socket.handlers';

export const initWebSocket = (server: HttpServer): SocketIOServer => {
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    registerHandlers(io, socket);
  });
  return io;
};`,
  'src/websocket/socket.handlers.ts': `import { Server, Socket } from 'socket.io';
export const registerHandlers = (io: Server, socket: Socket) => {
  // TODO: register event handlers
};`,

  'src/app.ts': `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { requestLogger } from './middleware/request-logger.middleware';
import { errorHandler } from './middleware/error-handler.middleware';
import { appConfig } from './config';

import { authRoutes } from './modules/auth';
import { workflowRoutes } from './modules/workflow';
import { queueRoutes } from './modules/queue';
import { workerRoutes } from './modules/worker';
import { schedulerRoutes } from './modules/scheduler';
import { analyticsRoutes } from './modules/analytics';
import { notificationRoutes } from './modules/notifications';
import { logsRoutes } from './modules/logs';
import { dashboardRoutes } from './modules/dashboard';

export const app = express();

app.use(cors({ origin: appConfig.corsOrigin }));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(requestLogger);

app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/queues', queueRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/scheduler', schedulerRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(errorHandler);`,
  'src/server.ts': `import { app } from './app';
import { initWebSocket } from './websocket/socket.server';
import { prisma } from './database';
import { logger } from './services/logger.service';
import { appConfig } from './config';
import http from 'http';

const server = http.createServer(app);
initWebSocket(server);

const startServer = async () => {
  try {
    await prisma.$connect();
    server.listen(appConfig.port, () => {
      logger.info(\`Server running on port \${appConfig.port}\`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

startServer();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});`
};

Object.assign(files, srcFiles);

for (const [relativePath, content] of Object.entries(files)) {
  const fullPath = path.join(baseDir, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content, 'utf8');
}
console.log('Done generating backend scaffolding for FlowForge.');
