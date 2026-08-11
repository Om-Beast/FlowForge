import { prisma } from '../../database';
import { Prisma } from '@prisma/client';
import { buildPaginatedResult, parsePaginationParams, calculateSkip } from '../../utils';

export class LogsService {
  async getExecutionLogs(
    userId: string,
    options: {
      workflowId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    } = {},
  ) {
    const { workflowId, status, startDate, endDate, page: rawPage, limit: rawLimit } = options;
    const { page, limit } = parsePaginationParams(rawPage, rawLimit);
    const skip = calculateSkip(page, limit);

    const where: Prisma.WorkflowExecutionWhereInput = {
      userId,
      ...(workflowId ? { workflowId } : {}),
      ...(status ? { status: status as Prisma.EnumExecutionStatusFilter } : {}),
      ...((startDate || endDate)
        ? {
            createdAt: {
              ...(startDate ? { gte: new Date(startDate) } : {}),
              ...(endDate ? { lte: new Date(endDate) } : {}),
            },
          }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.workflowExecution.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          workflow: { select: { name: true } },
          steps: { orderBy: { order: 'asc' } },
        },
      }),
      prisma.workflowExecution.count({ where }),
    ]);

    return buildPaginatedResult(data, total, page, limit);
  }

  async getExecutionById(executionId: string, userId: string) {
    return prisma.workflowExecution.findFirst({
      where: { id: executionId, userId },
      include: {
        workflow: { select: { name: true, definition: true } },
        steps: { orderBy: { order: 'asc' } },
      },
    });
  }

  async getAuditLogs(userId: string, page = 1, limit = 20) {
    const { page: p, limit: l } = parsePaginationParams(page, limit);
    const skip = calculateSkip(p, l);
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: { userId },
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where: { userId } }),
    ]);
    return buildPaginatedResult(data, total, p, l);
  }
}
