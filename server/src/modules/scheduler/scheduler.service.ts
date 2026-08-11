/**
 * SchedulerService
 *
 * Manages ScheduledJob records (cron-based workflow triggers).
 *
 * Architecture note:
 *   - computeNextRun is a placeholder; replace with a proper cron library
 *     such as `croner` in a production build.
 *   - processDueJobs runs every 60 s via a setInterval; for horizontal scale
 *     wrap with a Redis-based distributed lock (Redlock) so only one pod
 *     triggers per interval.
 *   - All user-facing queries are scoped to `userId` to prevent IDOR.
 */
import { prisma } from '../../database';
import { queueService } from '../queue';
import { logger } from '../../utils';
import { ApiError } from '../../shared/errors';

export interface CreateJobInput {
  userId: string;
  workflowId: string;
  cronExpression: string;
  timezone?: string;
}

export interface UpdateJobInput {
  cronExpression?: string;
  timezone?: string;
}

export class SchedulerService {
  private interval: NodeJS.Timeout | null = null;

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  start(): void {
    this.interval = setInterval(() => this.processDueJobs(), 60_000);
    this.interval.unref();
    logger.info('Scheduler started (60 s poll interval)');
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    logger.info('Scheduler stopped');
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────────

  async listJobs(userId: string) {
    return prisma.scheduledJob.findMany({
      where: { workflow: { userId } },
      include: { workflow: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJob(id: string, userId: string) {
    const job = await prisma.scheduledJob.findFirst({
      where: { id, workflow: { userId } },
      include: { workflow: { select: { id: true, name: true } } },
    });
    if (!job) throw ApiError.notFound('ScheduledJob', id);
    return job;
  }

  async createJob(input: CreateJobInput) {
    const { userId, workflowId, cronExpression, timezone = 'UTC' } = input;

    // Verify the workflow belongs to the calling user
    const workflow = await prisma.workflow.findFirst({ where: { id: workflowId, userId } });
    if (!workflow) throw ApiError.notFound('Workflow', workflowId);

    return prisma.scheduledJob.create({
      data: {
        workflowId,
        cronExpression,
        timezone,
        nextRunAt: this.computeNextRun(cronExpression),
        status: 'ACTIVE',
      },
    });
  }

  async updateJob(id: string, userId: string, input: UpdateJobInput) {
    await this.getJob(id, userId); // ensures ownership

    return prisma.scheduledJob.update({
      where: { id },
      data: {
        ...(input.cronExpression ? { cronExpression: input.cronExpression, nextRunAt: this.computeNextRun(input.cronExpression) } : {}),
        ...(input.timezone ? { timezone: input.timezone } : {}),
      },
    });
  }

  async deleteJob(id: string, userId: string): Promise<void> {
    await this.getJob(id, userId); // ensures ownership
    await prisma.scheduledJob.delete({ where: { id } });
  }

  async pauseJob(id: string, userId: string) {
    await this.getJob(id, userId);
    return prisma.scheduledJob.update({ where: { id }, data: { status: 'PAUSED' } });
  }

  async resumeJob(id: string, userId: string) {
    await this.getJob(id, userId);
    return prisma.scheduledJob.update({
      where: { id },
      data: { status: 'ACTIVE', nextRunAt: this.computeNextRun('* * * * *') },
    });
  }

  // ── Legacy helpers (backward-compat) ─────────────────────────────────────────

  async createSchedule(workflowId: string, cronExpression: string, timezone = 'UTC') {
    return prisma.scheduledJob.create({
      data: { workflowId, cronExpression, timezone, nextRunAt: this.computeNextRun(cronExpression), status: 'ACTIVE' },
    });
  }

  async deleteSchedule(scheduleId: string): Promise<void> {
    await prisma.scheduledJob.delete({ where: { id: scheduleId } });
  }

  async pauseSchedule(scheduleId: string): Promise<void> {
    await prisma.scheduledJob.update({ where: { id: scheduleId }, data: { status: 'PAUSED' } });
  }

  async resumeSchedule(scheduleId: string): Promise<void> {
    await prisma.scheduledJob.update({
      where: { id: scheduleId },
      data: { status: 'ACTIVE', nextRunAt: this.computeNextRun('* * * * *') },
    });
  }

  async getSchedules(workflowId: string) {
    return prisma.scheduledJob.findMany({ where: { workflowId } });
  }

  // ── Due-job processing ───────────────────────────────────────────────────────

  private async processDueJobs(): Promise<void> {
    const now = new Date();

    const dueJobs = await prisma.scheduledJob.findMany({
      where: { status: 'ACTIVE', nextRunAt: { lte: now } },
      include: { workflow: true },
    });

    for (const job of dueJobs) {
      try {
        const execution = await prisma.workflowExecution.create({
          data: {
            workflowId: job.workflowId,
            userId: job.workflow.userId,
            status: 'PENDING',
            triggeredBy: 'scheduler',
          },
        });

        await queueService.enqueue({
          workflowId: job.workflowId,
          executionId: execution.id,
          userId: job.workflow.userId,
        });

        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: { lastRunAt: now, nextRunAt: this.computeNextRun(job.cronExpression) },
        });

        logger.info('Scheduled workflow triggered', { workflowId: job.workflowId, jobId: job.id });
      } catch (err) {
        logger.error('Failed to trigger scheduled workflow', {
          jobId: job.id,
          error: (err as Error).message,
        });
        await prisma.scheduledJob.update({
          where: { id: job.id },
          data: { failedCount: { increment: 1 } },
        });
      }
    }
  }

  /**
   * Compute the next run time for a cron expression.
   * Placeholder: always returns now + 60 s.
   * Replace with `croner` or `node-schedule` to parse the expression properly.
   */
  private computeNextRun(_cronExpression: string): Date {
    const next = new Date();
    next.setMinutes(next.getMinutes() + 1);
    return next;
  }
}

export const schedulerService = new SchedulerService();
