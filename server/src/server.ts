import 'dotenv/config';
import http from 'http';
import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './database';
import { getRedisClient, disconnectRedis, logger } from './utils';
import { appConfig } from './config';
import { initializeSocketServer, closeSocketServer } from './websocket';
import { workflowWorker } from './modules/worker';
import { eventBus } from './events';
import { NotificationService } from './modules/notifications';
import { prisma } from './database';

const SHUTDOWN_TIMEOUT_MS = 15_000;

let httpServer: http.Server | null = null;

const bootstrap = async (): Promise<void> => {
  try {
    // 1. Connect database
    await connectDatabase();

    // 2. Warm up Redis
    const redis = getRedisClient();
    await redis.ping();
    logger.info('Redis connection verified');

    // 3. Create Express application
    const app = createApp();

    // 4. Create HTTP server
    httpServer = http.createServer(app);

    // 5. Initialize Socket.IO
    initializeSocketServer(httpServer);

    // 6. Start listening
    await new Promise<void>((resolve, reject) => {
      httpServer!.listen(appConfig.port, () => resolve());
      httpServer!.once('error', reject);
    });

    // 7. Start BullMQ workflow worker
    workflowWorker.start();
    logger.info('BullMQ worker started');

    // 8. Wire notification:send → persist to DB (fire-and-forget)
    const notifService = new NotificationService();
    eventBus.subscribe('notification:send', async (payload) => {
      try {
        await notifService.create({
          userId: payload.userId,
          type: payload.type as 'EXECUTION_SUCCESS' | 'EXECUTION_FAILURE' | 'WORKFLOW_TRIGGERED' | 'SYSTEM',
          title: payload.title,
          message: payload.message,
          metadata: payload.metadata,
        });
      } catch (err) {
        logger.error('Failed to persist notification', { error: (err as Error).message });
      }
    });

    // 9. Wire workflow/execution events → audit log (fire-and-forget)
    const auditAction = async (action: string, resource: string, resourceId: string, userId?: string) => {
      try {
        await prisma.auditLog.create({ data: { action, resource, resourceId, userId } });
      } catch { /* non-critical */ }
    };
    eventBus.subscribe('workflow:created', (p) => auditAction('workflow.created', 'workflow', p.workflowId, p.userId));
    eventBus.subscribe('workflow:updated', (p) => auditAction('workflow.updated', 'workflow', p.workflowId, p.userId));
    eventBus.subscribe('workflow:deleted', (p) => auditAction('workflow.deleted', 'workflow', p.workflowId, p.userId));
    eventBus.subscribe('execution:completed', (p) => auditAction('execution.completed', 'execution', p.executionId, p.userId));
    eventBus.subscribe('execution:failed', (p) => auditAction('execution.failed', 'execution', p.executionId, p.userId));

    logger.info(
      `🚀 FlowForge API server running`,
      {
        port: appConfig.port,
        env: appConfig.env,
        pid: process.pid,
      },
    );
  } catch (err) {
    logger.error('Failed to start server', {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    process.exit(1);
  }

};

const gracefulShutdown = async (signal: string): Promise<void> => {
  logger.info(`${signal} received — starting graceful shutdown`);

  const shutdownTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  try {
    // 1. Stop accepting new HTTP connections
    if (httpServer) {
      await new Promise<void>((resolve, reject) => {
        httpServer!.close((err) => (err ? reject(err) : resolve()));
      });
      logger.info('HTTP server closed');
    }

    // 2. Close Socket.IO connections
    await closeSocketServer();

    // 3. Close BullMQ worker gracefully
    await workflowWorker.close();
    logger.info('Worker closed');

    // 4. Disconnect from database
    await disconnectDatabase();

    // 5. Disconnect from Redis
    await disconnectRedis();

    clearTimeout(shutdownTimer);
    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    clearTimeout(shutdownTimer);
    logger.error('Error during graceful shutdown', {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
};

// ── Process signal handlers ───────────────────────────────────────────────────

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { error: err.message, stack: err.stack });
  gracefulShutdown('uncaughtException').finally(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', {
    reason: reason instanceof Error ? reason.message : String(reason),
  });
});

// ── Boot ──────────────────────────────────────────────────────────────────────

bootstrap();
