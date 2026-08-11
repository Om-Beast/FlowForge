import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { appConfig } from './config';
import {
  requestLogger,
  errorHandler,
  rateLimiter,
} from './middleware';
import { logger } from './utils';

// ── Module route imports ──────────────────────────────────────────────────────
import { authRoutes } from './modules/auth';
import { workflowRoutes } from './modules/workflow';
import { queueRoutes } from './modules/queue';
import { workerRoutes } from './modules/worker';
import { schedulerRoutes } from './modules/scheduler';
import { analyticsRoutes } from './modules/analytics';
import { notificationRoutes } from './modules/notifications';
import { logsRoutes } from './modules/logs';
import { dashboardRoutes } from './modules/dashboard';

export const createApp = (): Application => {
  const app = express();

  // ── Security middleware ─────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        const allowedOrigins = appConfig.corsOrigin.split(',').map((o) => o.trim());
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`CORS: Origin '${origin}' not allowed`));
        }
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Request-Id',
        'X-Correlation-Id',
        'Idempotency-Key',
      ],
      credentials: true,
      maxAge: 86400,
    }),
  );

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Compression ─────────────────────────────────────────────────────────────
  app.use(
    compression({
      filter: (req, res) => {
        if (req.headers['x-no-compression']) return false;
        return compression.filter(req, res);
      },
      level: 6,
    }),
  );

  // ── Request logging ─────────────────────────────────────────────────────────
  app.use(requestLogger);

  // ── Global rate limiter ──────────────────────────────────────────────────────
  app.use(appConfig.apiPrefix, rateLimiter());

  // ── Health & readiness probes ────────────────────────────────────────────────
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      service: 'flowforge-api',
      version: process.env.npm_package_version ?? '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/ready', async (_req: Request, res: Response) => {
    // Check database and Redis connectivity
    try {
      const { prisma } = await import('./database');
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      logger.error('Readiness check failed', { error: (err as Error).message });
      res.status(503).json({
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      });
    }
  });

  app.get('/live', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'alive',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  });

  // ── API routes ───────────────────────────────────────────────────────────────
  const api = appConfig.apiPrefix;
  app.use(`${api}/auth`, authRoutes);
  app.use(`${api}/workflows`, workflowRoutes);
  app.use(`${api}/queues`, queueRoutes);
  app.use(`${api}/workers`, workerRoutes);
  app.use(`${api}/scheduler`, schedulerRoutes);
  app.use(`${api}/analytics`, analyticsRoutes);
  app.use(`${api}/notifications`, notificationRoutes);
  app.use(`${api}/logs`, logsRoutes);
  app.use(`${api}/dashboard`, dashboardRoutes);

  // ── 404 handler ──────────────────────────────────────────────────────────────
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${_req.method} ${_req.originalUrl} not found`,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // ── Global error handler ─────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};
