export const QUEUE_EVENTS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  PROGRESS: 'progress',
  ACTIVE: 'active',
  STALLED: 'stalled',
  WAITING: 'waiting',
  DRAINED: 'drained',
} as const;

export const WORKER_EVENTS = {
  COMPLETED: 'completed',
  FAILED: 'failed',
  ACTIVE: 'active',
  PROGRESS: 'progress',
  ERROR: 'error',
  STALLED: 'stalled',
} as const;

export const REDIS_KEYS = {
  IDEMPOTENCY: (key: string) => `idempotency:${key}`,
  RATE_LIMIT: (id: string, window: string) => `rate_limit:${id}:${window}`,
  USER_SESSION: (userId: string) => `session:${userId}`,
  REFRESH_TOKEN: (userId: string) => `refresh:${userId}`,
  QUEUE_METRICS: (queueName: string) => `metrics:${queueName}`,
  WORKER_HEALTH: (workerId: string) => `worker:${workerId}`,
} as const;

export const IDEMPOTENCY_TTL_SECONDS = 86400; // 24 hours
export const RATE_LIMIT_TTL_SECONDS = 60;
export const SESSION_TTL_SECONDS = 604800; // 7 days
