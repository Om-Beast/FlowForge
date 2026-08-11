import { z } from 'zod';

const LoggerConfigSchema = z.object({
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
  LOG_FORMAT: z.enum(['json', 'pretty']).default('json'),
  LOG_DIR: z.string().default('logs'),
  LOG_FILE_ENABLED: z.coerce.boolean().default(true),
  LOG_MAX_FILES: z.string().default('14d'),
  LOG_MAX_SIZE: z.string().default('20m'),
});

const parsed = LoggerConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid logger configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const loggerConfig = {
  level: parsed.data.LOG_LEVEL,
  format: parsed.data.LOG_FORMAT,
  dir: parsed.data.LOG_DIR,
  file: {
    enabled: parsed.data.LOG_FILE_ENABLED,
    maxFiles: parsed.data.LOG_MAX_FILES,
    maxSize: parsed.data.LOG_MAX_SIZE,
  },
} as const;

export type LoggerConfig = typeof loggerConfig;
