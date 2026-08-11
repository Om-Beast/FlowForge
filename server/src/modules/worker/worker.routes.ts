import { Router } from 'express';
import { authenticate, authorize } from '../../middleware';
import { asyncHandler } from '../../utils/async-wrapper.utils';
import { workerController } from './worker.controller';
import { UserRole } from '../../shared/enums';

const router = Router();

router.use(authenticate);

// Health check – available to any authenticated user for monitoring dashboards
router.get('/health', asyncHandler(workerController.health.bind(workerController)));

// Full status with queue stats – admin only
router.get(
  '/status',
  authorize(UserRole.ADMIN),
  asyncHandler(workerController.status.bind(workerController)),
);

export const workerRoutes = router;
