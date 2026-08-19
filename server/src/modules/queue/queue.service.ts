import { Queue, QueueEvents } from 'bullmq';
import { getBullMQConnection } from '../../utils';
import { QueueName, JobPriority } from '../../shared/enums';
import { queueConfig } from '../../config';
import { logger } from '../../utils';
import { eventBus } from '../../events';

export interface EnqueueJobOptions {
  workflowId: string;
  executionId: string;
  userId: string;
  input?: Record<string, unknown>;
  priority?: JobPriority;
  delay?: number;
}

export interface QueueStats {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

class QueueService {
  private readonly executionQueue: Queue;
  private readonly queueEvents: QueueEvents;
  private metricsInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Pass plain ConnectionOptions to BullMQ — NOT live IORedis instances.
    // BullMQ 5 duplicates any IORedis instance it receives, cloning our
    // retryStrategy along with it. Each normal BullMQ reconnect (blocking
    // command cycle, QueueEvents subscribe/reconnect) then fires
    // logger.warn("Redis retry attempt 1") producing endless false-alarm spam.
    // With plain options, BullMQ owns and manages its own connections cleanly.
    const connection = getBullMQConnection();

    this.executionQueue = new Queue(QueueName.WORKFLOW_EXECUTION, {
      connection,
      defaultJobOptions: {
        attempts: queueConfig.retry.maxAttempts,
        backoff: {
          type: 'exponential',
          delay: queueConfig.retry.backoffDelayMs,
        },
        removeOnComplete: { count: queueConfig.retention.completed },
        removeOnFail: { count: queueConfig.retention.failed },
      },
    });

    this.queueEvents = new QueueEvents(QueueName.WORKFLOW_EXECUTION, {
      connection,
    });

    this.setupQueueEventListeners();
    this.startMetricsEmitter();
  }

  async enqueue(options: EnqueueJobOptions): Promise<string> {
    const job = await this.executionQueue.add(
      'execute-workflow',
      {
        workflowId: options.workflowId,
        executionId: options.executionId,
        userId: options.userId,
        input: options.input ?? {},
      },
      {
        jobId: options.executionId,
        priority: options.priority ?? JobPriority.NORMAL,
        delay: options.delay ?? 0,
      },
    );

    logger.info('Job enqueued', { jobId: job.id, workflowId: options.workflowId });
    return job.id ?? options.executionId;
  }

  async getStats(): Promise<QueueStats> {
    const counts = await this.executionQueue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );

    return {
      name: QueueName.WORKFLOW_EXECUTION,
      waiting: counts['waiting'] ?? 0,
      active: counts['active'] ?? 0,
      completed: counts['completed'] ?? 0,
      failed: counts['failed'] ?? 0,
      delayed: counts['delayed'] ?? 0,
      paused: counts['paused'] ?? 0,
    };
  }

  async pauseQueue(): Promise<void> {
    await this.executionQueue.pause();
    logger.warn('Execution queue paused');
  }

  async resumeQueue(): Promise<void> {
    await this.executionQueue.resume();
    logger.info('Execution queue resumed');
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.executionQueue.getJob(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);
    await job.retry();
    logger.info('Job retried', { jobId });
  }

  async getFailedJobs(limit = 50) {
    return this.executionQueue.getFailed(0, limit - 1);
  }

  async getJob(jobId: string) {
    return this.executionQueue.getJob(jobId);
  }

  getExecutionQueue(): Queue {
    return this.executionQueue;
  }

  private setupQueueEventListeners(): void {
    this.queueEvents.on('completed', ({ jobId }) => {
      logger.debug('Queue: job completed', { jobId });
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.warn('Queue: job failed', { jobId, reason: failedReason });
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      logger.warn('Queue: job stalled', { jobId });
    });
  }

  private startMetricsEmitter(): void {
    this.metricsInterval = setInterval(async () => {
      try {
        const stats = await this.getStats();
        eventBus.publish('queue:metrics', {
          queueName: stats.name,
          waiting: stats.waiting,
          active: stats.active,
          completed: stats.completed,
          failed: stats.failed,
          delayed: stats.delayed,
          paused: stats.paused,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        logger.error('Failed to emit queue metrics', { error: (err as Error).message });
      }
    }, 5000);

    this.metricsInterval.unref();
  }

  async close(): Promise<void> {
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    // BullMQ owns and closes its own connections when Queue/QueueEvents are closed.
    await Promise.all([
      this.executionQueue.close(),
      this.queueEvents.close(),
    ]);
    logger.info('Queue service closed');
  }
}

export const queueService = new QueueService();
