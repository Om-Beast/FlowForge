import IORedis, { RedisOptions } from 'ioredis';
import { redisConfig } from '../config';
import { logger } from './logger';

let redisInstance: IORedis | null = null;

export const getRedisClient = (): IORedis => {
  if (!redisInstance) {
    redisInstance = createRedisClient();
  }
  return redisInstance;
};

/**
 * Creates an ioredis client.
 *
 * BullMQ imposes two hard requirements on the connections it manages:
 *   1. `maxRetriesPerRequest` MUST be `null`  (blocking commands need no per-request retry cap)
 *   2. `commandTimeout`  MUST NOT be set      (BullMQ uses blocking BRPOP / BLMOVE; a finite
 *                                               commandTimeout causes "Command timed out" spam)
 *   3. `enableReadyCheck` SHOULD be `false`   (BullMQ controls its own connection lifecycle)
 *
 * Convention: callers that pass `{ keyPrefix: '' }` are BullMQ connections.
 * The regular shared client retains sane defaults for application code.
 */
export const createRedisClient = (options: Partial<RedisOptions> = {}): IORedis => {
  const isBullMQConnection =
    Object.prototype.hasOwnProperty.call(options, 'keyPrefix') && options.keyPrefix === '';

  const baseOptions: RedisOptions = {
    host: redisConfig.host,
    port: redisConfig.port,
    password: redisConfig.password || undefined,
    db: redisConfig.db,
    keyPrefix: redisConfig.keyPrefix,
    retryStrategy: (times) => {
      if (times > redisConfig.maxRetries) {
        logger.error('Redis max retries exceeded, giving up', { attempts: times });
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      logger.warn(`Redis retry attempt ${times}, waiting ${delay}ms`);
      return delay;
    },
    connectTimeout: redisConfig.timeouts.connection,
    lazyConnect: false,
  };

  if (isBullMQConnection) {
    // BullMQ-specific overrides — these must NOT be changed without understanding BullMQ internals
    Object.assign(baseOptions, {
      maxRetriesPerRequest: null,  // required by BullMQ
      enableReadyCheck: false,     // BullMQ controls its own lifecycle
      // commandTimeout intentionally omitted: BullMQ uses blocking commands (BRPOP/BLMOVE)
      // that legitimately block for up to 30 s — a finite commandTimeout breaks them
    } satisfies Partial<RedisOptions>);
  } else {
    Object.assign(baseOptions, {
      commandTimeout: redisConfig.timeouts.command,
      enableReadyCheck: true,
      maxRetriesPerRequest: 3,
    } satisfies Partial<RedisOptions>);
  }

  // Allow caller overrides last (but BullMQ callers only pass keyPrefix:'', so safe)
  const client = new IORedis({ ...baseOptions, ...options });

  client.on('connect', () => logger.info('Redis client connected'));
  client.on('ready', () => logger.info('Redis client ready'));
  client.on('error', (err) => logger.error('Redis client error', { error: err.message }));
  client.on('close', () => logger.warn('Redis connection closed'));
  client.on('reconnecting', () => logger.info('Redis reconnecting'));

  return client;
};

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
