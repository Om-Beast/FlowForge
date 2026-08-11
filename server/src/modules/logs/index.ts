import { Router } from 'express';
import { LogsService } from './logs.service';
import { authenticate } from '../../middleware';
import { asyncHandler, sendSuccess } from '../../utils';
import { ApiError } from '../../shared/errors';
import { AuthenticatedRequest } from '../../shared/types';
import { Request, Response } from 'express';

const router = Router();
const service = new LogsService();

router.use(authenticate);

router.get('/executions', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const { workflowId, status, startDate, endDate, page, limit } = req.query as Record<string, string>;
  const result = await service.getExecutionLogs(userId, {
    workflowId,
    status,
    startDate,
    endDate,
    page: parseInt(page ?? '1', 10),
    limit: parseInt(limit ?? '20', 10),
  });
  sendSuccess(res, result.data, { meta: result.meta });
}));

router.get('/executions/:id', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const execution = await service.getExecutionById((req.params as {id:string}).id, userId);
  if (!execution) throw ApiError.notFound('Execution', (req.params as {id:string}).id);
  sendSuccess(res, execution);
}));

router.get('/audit', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const page = parseInt((req.query['page'] as string) ?? '1', 10);
  const limit = parseInt((req.query['limit'] as string) ?? '20', 10);
  const result = await service.getAuditLogs(userId, page, limit);
  sendSuccess(res, result.data, { meta: result.meta });
}));

export const logsRoutes = router;
export { LogsService } from './logs.service';
