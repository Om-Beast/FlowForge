import { z } from 'zod';

const QueueConfigSchema = z.object({
  QUEUE_CONCURRENCY: z.coerce.number().int().positive().default(5),
  QUEUE_MAX_STALLED_COUNT: z.coerce.number().int().min(0).default(3),
  QUEUE_STALLED_INTERVAL_MS: z.coerce.number().default(30000),
  QUEUE_JOB_TIMEOUT_MS: z.coerce.number().default(300000),
  QUEUE_JOB_RETENTION_COMPLETED: z.coerce.number().int().default(1000),
  QUEUE_JOB_RETENTION_FAILED: z.coerce.number().int().default(5000),
  QUEUE_MAX_RETRY_ATTEMPTS: z.coerce.number().int().default(3),
  QUEUE_BACKOFF_DELAY_MS: z.coerce.number().default(1000),
});

const parsed = QueueConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid queue configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const queueConfig = {
  concurrency: parsed.data.QUEUE_CONCURRENCY,
  maxStalledCount: parsed.data.QUEUE_MAX_STALLED_COUNT,
  stalledInterval: parsed.data.QUEUE_STALLED_INTERVAL_MS,
  jobTimeout: parsed.data.QUEUE_JOB_TIMEOUT_MS,
  retention: {
    completed: parsed.data.QUEUE_JOB_RETENTION_COMPLETED,
    failed: parsed.data.QUEUE_JOB_RETENTION_FAILED,
  },
  retry: {
    maxAttempts: parsed.data.QUEUE_MAX_RETRY_ATTEMPTS,
    backoffDelayMs: parsed.data.QUEUE_BACKOFF_DELAY_MS,
  },
} as const;

export type QueueConfig = typeof queueConfig;
