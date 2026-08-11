import { prisma } from '../../database';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult, parsePaginationParams, calculateSkip } from '../../utils';
import { ApiError } from '../../shared/errors';

export class NotificationService {
  async getAll(userId: string, page = 1, limit = 20, unreadOnly = false) {
    const { page: p, limit: l } = parsePaginationParams(page, limit);
    const skip = calculateSkip(p, l);
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    return buildPaginatedResult(data, total, p, l);
  }

  async markRead(id: string, userId: string): Promise<void> {
    const notification = await prisma.notification.findFirst({ where: { id, userId } });
    if (!notification) throw ApiError.notFound('Notification', id);
    await prisma.notification.update({ where: { id }, data: { isRead: true } });
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, isRead: false } });
  }

  async create(data: {
    userId: string;
    type: 'EXECUTION_SUCCESS' | 'EXECUTION_FAILURE' | 'WORKFLOW_TRIGGERED' | 'SYSTEM';
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        metadata: data.metadata as Prisma.InputJsonValue,
      },
    });
  }
}
