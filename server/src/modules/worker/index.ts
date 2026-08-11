import { Router } from 'express';
import { workflowWorker } from './worker.service';
import { authenticate, authorize } from '../../middleware';
import { asyncHandler, sendSuccess } from '../../utils';
import { UserRole } from '../../shared/enums';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

router.get('/health', asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, {
    status: 'running',
    timestamp: new Date().toISOString(),
  });
}));

export const workerRoutes = router;
export { WorkflowWorker, workflowWorker } from './worker.service';
export type { WorkflowJobData } from './worker.service';
