/**
 * Scheduler Controller
 *
 * Exposes CRUD and control endpoints for ScheduledJobs:
 *   GET    /scheduler               – list user's scheduled jobs
 *   POST   /scheduler               – create a new scheduled job
 *   GET    /scheduler/:id           – get a single scheduled job
 *   PATCH  /scheduler/:id          – update cron expression / timezone
 *   DELETE /scheduler/:id          – remove scheduled job
 *   POST   /scheduler/:id/pause    – pause a scheduled job
 *   POST   /scheduler/:id/resume   – resume a scheduled job
 */
import { Request, Response } from 'express';
import { SchedulerService } from './scheduler.service';
import { sendSuccess, sendCreated, sendNoContent } from '../../utils/response.utils';
import { AuthenticatedRequest } from '../../shared/types';

export class SchedulerController {
  private readonly service = new SchedulerService();

  async list(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const jobs = await this.service.listJobs(userId);
    sendSuccess(res, jobs);
  }

  async create(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const job = await this.service.createJob({ userId, ...req.body });
    sendCreated(res, job, 'Scheduled job created');
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const job = await this.service.getJob((req.params as { id: string }).id, userId);
    sendSuccess(res, job);
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const updated = await this.service.updateJob(
      (req.params as { id: string }).id,
      userId,
      req.body,
    );
    sendSuccess(res, updated);
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    await this.service.deleteJob((req.params as { id: string }).id, userId);
    sendNoContent(res);
  }

  async pause(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const job = await this.service.pauseJob((req.params as { id: string }).id, userId);
    sendSuccess(res, job);
  }

  async resume(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const job = await this.service.resumeJob((req.params as { id: string }).id, userId);
    sendSuccess(res, job);
  }
}

export const schedulerController = new SchedulerController();
