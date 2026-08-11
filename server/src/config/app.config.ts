import { z } from 'zod';

const AppConfigSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  API_PREFIX: z.string().default('/api'),
  REQUEST_TIMEOUT_MS: z.coerce.number().default(30000),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

const parsed = AppConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid application configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const appConfig = {
  env: parsed.data.NODE_ENV,
  port: parsed.data.PORT,
  corsOrigin: parsed.data.CORS_ORIGIN,
  logLevel: parsed.data.LOG_LEVEL,
  apiPrefix: parsed.data.API_PREFIX,
  requestTimeoutMs: parsed.data.REQUEST_TIMEOUT_MS,
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
  },
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
} as const;

export type AppConfig = typeof appConfig;
