/**
 * Worker Controller
 *
 * Exposes operational endpoints for the BullMQ workflow worker:
 *   GET  /workers/health  – liveness of the worker process
 *   GET  /workers/status  – current worker concurrency / stats snapshot
 *
 * The worker itself runs inside the same Node.js process as the HTTP server
 * (monolith mode). In a scaled deployment you would extract the worker into
 * its own service and expose these health checks via a sidecar.
 */
import { Request, Response } from 'express';
import { workflowWorker } from './worker.service';
import { sendSuccess } from '../../utils/response.utils';
import { queueService } from '../queue/queue.service';

export class WorkerController {
  async health(_req: Request, res: Response): Promise<void> {
    sendSuccess(res, {
      status: 'running',
      pid: process.pid,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  }

  async status(_req: Request, res: Response): Promise<void> {
    const queueStats = await queueService.getStats();
    sendSuccess(res, {
      worker: {
        status: 'running',
        pid: process.pid,
        uptime: Math.round(process.uptime()),
        memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      },
      queue: queueStats,
      timestamp: new Date().toISOString(),
    });
  }
}

export const workerController = new WorkerController();
