import { WorkflowRepository } from './workflow.repository';
import { workflowDagValidator } from './workflow.dag';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowDto,
  WorkflowFilter,
  WorkflowDefinition,
} from './workflow.types';
import { WorkflowStatus, TriggerType } from '../../shared/enums';
import { ApiError } from '../../shared/errors';
import { FindManyOptions, PaginatedResult } from '../../shared/interfaces';
import { eventBus } from '../../events';
import { logger } from '../../utils';
import { Prisma } from '@prisma/client';

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

const mapToDto = (w: WorkflowRow): WorkflowDto => ({
  id: w.id,
  name: w.name,
  description: w.description,
  definition: w.definition as unknown as WorkflowDefinition,
  status: w.status as WorkflowStatus,
  triggerType: w.triggerType as TriggerType,
  version: w.version,
  userId: w.userId,
  createdAt: w.createdAt,
  updatedAt: w.updatedAt,
  _count: w._count,
});

export class WorkflowService {
  private readonly repo: WorkflowRepository;

  constructor() {
    this.repo = new WorkflowRepository();
  }

  async create(userId: string, dto: CreateWorkflowDto): Promise<WorkflowDto> {
    const validation = workflowDagValidator.validate(dto.definition);
    if (!validation.isValid) {
      throw ApiError.unprocessable('Invalid workflow definition', validation.errors);
    }
    const workflow = await this.repo.create(userId, dto);
    eventBus.publish('workflow:created', { workflowId: workflow.id, userId, name: workflow.name });
    logger.info('Workflow created', { workflowId: workflow.id, userId });
    return mapToDto(workflow);
  }

  async findById(id: string, userId: string): Promise<WorkflowDto> {
    const workflow = await this.repo.findById(id, userId);
    if (!workflow) throw ApiError.notFound('Workflow', id);
    return mapToDto(workflow);
  }

  async findMany(
    userId: string,
    options: FindManyOptions<WorkflowFilter> = {},
  ): Promise<PaginatedResult<WorkflowDto>> {
    const result = await this.repo.findMany(userId, options);
    return { data: result.data.map(mapToDto), meta: result.meta };
  }

  async update(id: string, userId: string, dto: UpdateWorkflowDto): Promise<WorkflowDto> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw ApiError.notFound('Workflow', id);
    if (dto.definition) {
      const validation = workflowDagValidator.validate(dto.definition);
      if (!validation.isValid) throw ApiError.unprocessable('Invalid workflow definition', validation.errors);
    }
    const updated = await this.repo.update(id, userId, dto);
    eventBus.publish('workflow:updated', { workflowId: id, userId, changes: dto as Record<string, unknown> });
    return mapToDto(updated);
  }

  async delete(id: string, userId: string): Promise<void> {
    const existing = await this.repo.findById(id, userId);
    if (!existing) throw ApiError.notFound('Workflow', id);
    await this.repo.delete(id, userId);
    eventBus.publish('workflow:deleted', { workflowId: id, userId });
    logger.info('Workflow deleted', { workflowId: id, userId });
  }

  async activate(id: string, userId: string): Promise<WorkflowDto> {
    return this.update(id, userId, { status: WorkflowStatus.ACTIVE });
  }

  async deactivate(id: string, userId: string): Promise<WorkflowDto> {
    return this.update(id, userId, { status: WorkflowStatus.INACTIVE });
  }

  async validateDefinition(definition: WorkflowDefinition) {
    return workflowDagValidator.validate(definition);
  }
}
