import { Router } from 'express';
import { LogsService } from './logs.service';
import { authenticate } from '../../middleware';
import { asyncHandler, sendSuccess } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';
import { Request, Response } from 'express';
import { ApiError } from '../../shared/errors';

const router = Router();
const service = new LogsService();

router.use(authenticate);

// GET /api/logs/executions — paginated execution history
router.get(
  '/executions',
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const { workflowId, status, startDate, endDate, page, limit } = req.query as Record<string, string>;
    const result = await service.getExecutionLogs(userId, {
      workflowId,
      status,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    sendSuccess(res, result.data, { meta: result.meta });
  }),
);

// GET /api/logs/executions/:id — single execution with steps
router.get(
  '/executions/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const execution = await service.getExecutionById(req.params['id']!, userId);
    if (!execution) throw ApiError.notFound('Execution', req.params['id']!);
    sendSuccess(res, execution);
  }),
);

// GET /api/logs/audit — audit log
router.get(
  '/audit',
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const { page, limit } = req.query as Record<string, string>;
    const result = await service.getAuditLogs(
      userId,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
    sendSuccess(res, result.data, { meta: result.meta });
  }),
);

export { router as logsRoutes };
