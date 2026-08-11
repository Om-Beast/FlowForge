import { z } from 'zod';

const AuthConfigSchema = z.object({
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(14).default(12),
});

const parsed = AuthConfigSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid auth configuration:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const authConfig = {
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },
  bcrypt: {
    rounds: parsed.data.BCRYPT_ROUNDS,
  },
} as const;

export type AuthConfig = typeof authConfig;
