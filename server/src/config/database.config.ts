import { z } from 'zod';

const DatabaseConfigSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection string'),
  DATABASE_POOL_MIN: z.coerce.number().int().positive().default(2),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  DATABASE_CONNECTION_TIMEOUT_MS: z.coerce.number().default(5000),
  DATABASE_QUERY_TIMEOUT_MS: z.coerce.number().default(10000),
});

const parsed = DatabaseConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid database configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const databaseConfig = {
  url: parsed.data.DATABASE_URL,
  pool: {
    min: parsed.data.DATABASE_POOL_MIN,
    max: parsed.data.DATABASE_POOL_MAX,
  },
  timeouts: {
    connection: parsed.data.DATABASE_CONNECTION_TIMEOUT_MS,
    query: parsed.data.DATABASE_QUERY_TIMEOUT_MS,
  },
} as const;

export type DatabaseConfig = typeof databaseConfig;
