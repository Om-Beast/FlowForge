import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../utils';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);
router.get('/summary', asyncHandler(controller.getSummary.bind(controller)));
router.get('/time-series', asyncHandler(controller.getTimeSeries.bind(controller)));
router.get('/workflow/:workflowId', asyncHandler(controller.getWorkflowStats.bind(controller)));

export const analyticsRoutes = router;
export { AnalyticsService } from './analytics.service';
