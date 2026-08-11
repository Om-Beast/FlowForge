import { Request, Response } from 'express';
import { WorkflowService } from './workflow.service';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';
import { parsePaginationParams } from '../../utils';
import { prisma } from '../../database';
import { queueService } from '../queue';
import { JobPriority, WorkflowStatus } from '../../shared/enums';
import { HTTP_STATUS } from '../../shared/constants';
import type { Prisma } from '@prisma/client';

export class WorkflowController {
  private readonly service: WorkflowService;

  constructor() {
    this.service = new WorkflowService();
  }

  async create(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflow = await this.service.create(userId, req.body);
    sendCreated(res, workflow, 'Workflow created', (req as AuthenticatedRequest).requestId);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const { page, limit, sortBy, sortOrder, status, search } = req.query as Record<string, string>;
    const { page: p, limit: l } = parsePaginationParams(page, limit);

    const result = await this.service.findMany(userId, {
      page: p,
      limit: l,
      sortBy,
      sortOrder: sortOrder as 'asc' | 'desc',
      filter: { status: status as WorkflowStatus, search },
    });

    sendPaginated(res, result, (req as AuthenticatedRequest).requestId);
  }

  async findOne(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflow = await this.service.findById(req.params['id']!, userId);
    sendSuccess(res, workflow, { requestId: (req as AuthenticatedRequest).requestId });
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflow = await this.service.update(req.params['id']!, userId, req.body);
    sendSuccess(res, workflow, {
      message: 'Workflow updated',
      requestId: (req as AuthenticatedRequest).requestId,
    });
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    await this.service.delete(req.params['id']!, userId);
    sendNoContent(res);
  }

  async activate(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflow = await this.service.activate(req.params['id']!, userId);
    sendSuccess(res, workflow, { message: 'Workflow activated', requestId: (req as AuthenticatedRequest).requestId });
  }

  async deactivate(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflow = await this.service.deactivate(req.params['id']!, userId);
    sendSuccess(res, workflow, { message: 'Workflow deactivated', requestId: (req as AuthenticatedRequest).requestId });
  }

  async validate(req: Request, res: Response): Promise<void> {
    const result = await this.service.validateDefinition(req.body.definition);
    sendSuccess(res, result, { requestId: (req as AuthenticatedRequest).requestId });
  }

  /**
   * POST /api/workflows/:id/execute
   * Creates a WorkflowExecution record and enqueues a BullMQ job.
   * Returns the executionId immediately (202 Accepted) so the client
   * can subscribe to the Socket.IO room `execution:<executionId>` for live updates.
   */
  async execute(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const workflowId = req.params['id']!;
    const { input = {}, priority } = req.body as { input?: Record<string, unknown>; priority?: number };

    // Verify workflow exists and belongs to this user
    await this.service.findById(workflowId, userId);

    // Create execution record in PENDING state
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId,
        status: 'PENDING',
        triggeredBy: 'manual',
        input: input as Prisma.JsonObject,
      },
    });

    // Enqueue BullMQ job
    const jobId = await queueService.enqueue({
      workflowId,
      executionId: execution.id,
      userId,
      input,
      priority: (priority as JobPriority) ?? JobPriority.NORMAL,
    });

    // Persist jobId reference
    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: { jobId },
    });

    sendSuccess(
      res,
      {
        executionId: execution.id,
        workflowId,
        status: 'PENDING',
        jobId,
        socketRoom: `execution:${execution.id}`,
      },
      {
        message: 'Execution queued. Subscribe to socket room for live updates.',
        statusCode: HTTP_STATUS.ACCEPTED,
        requestId: (req as AuthenticatedRequest).requestId,
      },
    );
  }
}
