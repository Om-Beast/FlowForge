import { prisma } from '../../database';
import { Prisma } from '@prisma/client';
import { WorkflowStatus } from '../../shared/enums';
import {
  calculateSkip,
  buildPaginatedResult,
  parsePaginationParams,
} from '../../utils';
import { PaginatedResult, FindManyOptions } from '../../shared/interfaces';
import { CreateWorkflowDto, UpdateWorkflowDto, WorkflowFilter, WorkflowDefinition } from './workflow.types';

type WorkflowRow = {
  id: string;
  name: string;
  description: string | null;
  definition: Prisma.JsonValue;
  status: string;
  triggerType: string;
  version: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count: { executions: number };
};

export class WorkflowRepository {
  async findById(id: string, userId?: string): Promise<WorkflowRow | null> {
    return prisma.workflow.findFirst({
      where: { id, ...(userId ? { userId } : {}) },
      include: { _count: { select: { executions: true } } },
    }) as Promise<WorkflowRow | null>;
  }

  async findMany(
    userId: string,
    options: FindManyOptions<WorkflowFilter> = {},
  ): Promise<PaginatedResult<WorkflowRow>> {
    const { filter = {}, page: rawPage, limit: rawLimit, sortBy = 'createdAt', sortOrder = 'desc' } = options;
    const { page, limit } = parsePaginationParams(rawPage, rawLimit);
    const skip = calculateSkip(page, limit);

    const where: Prisma.WorkflowWhereInput = {
      userId,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.search
        ? {
            OR: [
              { name: { contains: filter.search, mode: 'insensitive' } },
              { description: { contains: filter.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const validSortFields: Record<string, boolean> = { createdAt: true, updatedAt: true, name: true };
    const orderBy = validSortFields[sortBy]
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' as const };

    const [data, total] = await Promise.all([
      prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: { _count: { select: { executions: true } } },
      }),
      prisma.workflow.count({ where }),
    ]);

    return buildPaginatedResult(data as WorkflowRow[], total, page, limit);
  }

  async create(userId: string, dto: CreateWorkflowDto): Promise<WorkflowRow> {
    const workflow = await prisma.workflow.create({
      data: {
        name: dto.name,
        description: dto.description,
        definition: dto.definition as unknown as Prisma.InputJsonValue,
        triggerType: dto.triggerType ?? 'MANUAL',
        userId,
      },
      include: { _count: { select: { executions: true } } },
    });
    return workflow as WorkflowRow;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateWorkflowDto,
  ): Promise<WorkflowRow> {
    return prisma.workflow.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.definition !== undefined
          ? { definition: dto.definition as unknown as Prisma.InputJsonValue, version: { increment: 1 } }
          : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.triggerType !== undefined ? { triggerType: dto.triggerType } : {}),
      },
      include: { _count: { select: { executions: true } } },
    }) as Promise<WorkflowRow>;
  }

  async delete(id: string, userId: string): Promise<void> {
    await prisma.workflow.delete({ where: { id } });
  }

  async updateStatus(id: string, status: WorkflowStatus): Promise<void> {
    await prisma.workflow.update({ where: { id }, data: { status } });
  }
}
