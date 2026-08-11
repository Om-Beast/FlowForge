import { PrismaClient } from '@prisma/client';
import { appConfig } from '../config';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log:
      appConfig.isDevelopment
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
    errorFormat: appConfig.isProduction ? 'minimal' : 'pretty',
  });
};

// Prevent multiple Prisma Client instances in development (hot reloading)
export const prisma: PrismaClient =
  global.__prismaClient ?? createPrismaClient();

if (!appConfig.isProduction) {
  global.__prismaClient = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.info('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.info('🔌 Database disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting database:', error);
  }
}
