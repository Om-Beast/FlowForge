import { z } from 'zod';

const SocketConfigSchema = z.object({
  SOCKET_PING_TIMEOUT_MS: z.coerce.number().default(20000),
  SOCKET_PING_INTERVAL_MS: z.coerce.number().default(10000),
  SOCKET_MAX_BUFFER_SIZE: z.coerce.number().default(1e8),
  SOCKET_ADAPTER: z.enum(['memory', 'redis']).default('redis'),
});

const parsed = SocketConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid socket configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const socketConfig = {
  pingTimeout: parsed.data.SOCKET_PING_TIMEOUT_MS,
  pingInterval: parsed.data.SOCKET_PING_INTERVAL_MS,
  maxBufferSize: parsed.data.SOCKET_MAX_BUFFER_SIZE,
  adapter: parsed.data.SOCKET_ADAPTER,
} as const;

export type SocketConfig = typeof socketConfig;
