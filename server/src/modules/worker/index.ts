import { Router } from 'express';
import { workerController } from './worker.controller';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../utils';

const router = Router();

router.use(authenticate);

router.get('/health', asyncHandler(workerController.health.bind(workerController)));
router.get('/status', asyncHandler(workerController.status.bind(workerController)));

export const workerRoutes = router;
export { WorkflowWorker, workflowWorker } from './worker.service';
export type { WorkflowJobData } from './worker.service';
