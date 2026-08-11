import { z } from 'zod';

const RedisConfigSchema = z.object({
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  // Empty string means "no password" — convert to undefined so ioredis doesn't send AUTH ""
  REDIS_PASSWORD: z.string().optional().transform((v) => (v === '' ? undefined : v)),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
  REDIS_KEY_PREFIX: z.string().default('flowforge:'),
  REDIS_TLS: z.coerce.boolean().default(false),
  REDIS_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().default(5000),
  REDIS_MAX_RETRIES: z.coerce.number().int().default(3),
});

const parsed = RedisConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid Redis configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const redisConfig = {
  host: parsed.data.REDIS_HOST,
  port: parsed.data.REDIS_PORT,
  password: parsed.data.REDIS_PASSWORD,
  db: parsed.data.REDIS_DB,
  keyPrefix: parsed.data.REDIS_KEY_PREFIX,
  tls: parsed.data.REDIS_TLS,
  timeouts: {
    connection: parsed.data.REDIS_CONNECTION_TIMEOUT_MS,
    command: parsed.data.REDIS_COMMAND_TIMEOUT_MS,
  },
  maxRetries: parsed.data.REDIS_MAX_RETRIES,
} as const;

export type RedisConfig = typeof redisConfig;
