// ─────────────────────────────────────────────────────────────────────────────
// Redis client factory
//
// Two distinct connection strategies:
//
//   A) getRedisClient()     — shared app IORedis singleton.
//      Used by: rate-limiter, idempotency, CacheService, server.ts ping.
//      Has commandTimeout + enableReadyCheck + per-request retry cap.
//      Emits structured logs on every lifecycle event.
//
//   B) getBullMQConnection() — plain RedisOptions object (NOT an IORedis instance).
//      Passed to Queue / Worker / QueueEvents constructors.
//
//      WHY plain options and not a live instance?
//      BullMQ 5 calls .duplicate() on any IORedis instance it receives, which
//      copies ALL ioredis options — including our retryStrategy with logger.warn.
//      BullMQ's normal lifecycle (blocking BRPOPLPUSH completions, QueueEvents
//      subscribe/reconnect cycles) then fires retryStrategy(1) on every cycle,
//      producing endless "Redis retry attempt 1" warnings even when Redis is
//      perfectly healthy.  Passing plain ConnectionOptions lets BullMQ create
//      and own its connections without ever cloning our retryStrategy.
// ─────────────────────────────────────────────────────────────────────────────

import IORedis, { RedisOptions } from 'ioredis';
import { redisConfig } from '../config';
import { logger } from './logger';

// ── A) Shared application Redis singleton ─────────────────────────────────────

let redisInstance: IORedis | null = null;

export const getRedisClient = (): IORedis => {
  if (!redisInstance) {
    redisInstance = new IORedis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password || undefined,
      db: redisConfig.db,
      keyPrefix: redisConfig.keyPrefix,
      connectTimeout: redisConfig.timeouts.connection,
      commandTimeout: redisConfig.timeouts.command,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
      lazyConnect: false,
      retryStrategy: (times) => {
        if (times > redisConfig.maxRetries) {
          logger.error('Redis max retries exceeded, giving up', { attempts: times });
          return null;
        }
        const delay = Math.min(times * 200, 2000);
        logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
        return delay;
      },
    });

    redisInstance.on('connect', () => logger.info('Redis client connected'));
    redisInstance.on('ready', () => logger.info('Redis client ready'));
    redisInstance.on('error', (err) => logger.error('Redis client error', { error: err.message }));
    redisInstance.on('close', () => logger.warn('Redis connection closed'));
    redisInstance.on('reconnecting', () => logger.info('Redis reconnecting'));
  }
  return redisInstance;
};

/**
 * @deprecated Use getRedisClient() for the app singleton.
 * Kept only for any legacy callers; do NOT pass the result to BullMQ.
 */
export const createRedisClient = (options: Partial<RedisOptions> = {}): IORedis =>
  getRedisClient();

// ── B) BullMQ connection options (plain object — no live IORedis instance) ────

/**
 * Returns a plain RedisOptions object for BullMQ constructors.
 *
 * Hard requirements for BullMQ connections:
 *   - maxRetriesPerRequest: null   REQUIRED (blocking BRPOP/BLMOVE must not be capped)
 *   - enableReadyCheck: false      BullMQ controls its own lifecycle
 *   - NO commandTimeout            blocking commands legitimately take up to 30 s
 *   - NO keyPrefix                 BullMQ namespaces its own keys internally
 *   - NO retryStrategy             BullMQ manages its own reconnection
 */
export const getBullMQConnection = (): RedisOptions => ({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password || undefined,
  db: redisConfig.db,
  // keyPrefix intentionally omitted — BullMQ manages its own key namespace
  maxRetriesPerRequest: null,  // REQUIRED by BullMQ (blocking commands)
  enableReadyCheck: false,     // BullMQ controls its own connection lifecycle
  connectTimeout: redisConfig.timeouts.connection,
  // commandTimeout intentionally omitted — BRPOP/BLMOVE block legitimately
  // retryStrategy intentionally omitted — prevents duplicate logger.warn spam
});

// ── Lifecycle helpers ─────────────────────────────────────────────────────────

export const disconnectRedis = async (): Promise<void> => {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
    logger.info('Redis client disconnected');
  }
};

export const withRedis = async <T>(
  operation: (client: IORedis) => Promise<T>,
): Promise<T> => {
  const client = getRedisClient();
  return operation(client);
};
