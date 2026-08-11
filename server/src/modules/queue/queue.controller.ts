/**
 * QueueController
 *
 * Delegates to QueueService. All methods are bound correctly so they can be
 * passed directly to asyncHandler without losing `this` context.
 *
 * Endpoints exposed (wired in queue/index.ts):
 *   GET  /queues/stats            – live queue depth counters
 *   GET  /queues/failed           – list failed jobs (admin only)
 *   POST /queues/pause            – pause execution queue (admin only)
 *   POST /queues/resume           – resume execution queue (admin only)
 *   POST /queues/jobs/:jobId/retry – retry a specific failed job (admin only)
 */
import { Request, Response } from 'express';
import { queueService } from './queue.service';
import { sendSuccess } from '../../utils/response.utils';

export class QueueController {
  async getStats(_req: Request, res: Response): Promise<void> {
    const stats = await queueService.getStats();
    sendSuccess(res, stats, { message: 'Queue statistics retrieved' });
  }

  async getFailedJobs(_req: Request, res: Response): Promise<void> {
    const jobs = await queueService.getFailedJobs();
    const payload = jobs.map((j) => ({
      id: j.id,
      name: j.name,
      data: j.data,
      failedReason: j.failedReason,
      attemptsMade: j.attemptsMade,
      processedOn: j.processedOn,
      finishedOn: j.finishedOn,
    }));
    sendSuccess(res, payload);
  }

  async pauseQueue(_req: Request, res: Response): Promise<void> {
    await queueService.pauseQueue();
    sendSuccess(res, { paused: true, timestamp: new Date().toISOString() });
  }

  async resumeQueue(_req: Request, res: Response): Promise<void> {
    await queueService.resumeQueue();
    sendSuccess(res, { paused: false, timestamp: new Date().toISOString() });
  }

  async retryJob(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as { jobId: string };
    await queueService.retryFailedJob(jobId);
    sendSuccess(res, { retried: true, jobId });
  }

  async getJob(req: Request, res: Response): Promise<void> {
    const { jobId } = req.params as { jobId: string };
    const job = await queueService.getJob(jobId);
    sendSuccess(res, job ? {
      id: job.id,
      name: job.name,
      data: job.data,
      attemptsMade: job.attemptsMade,
      processedOn: job.processedOn,
      finishedOn: job.finishedOn,
      failedReason: job.failedReason,
    } : null);
  }
}

export const queueController = new QueueController();
