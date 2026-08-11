import { Router } from 'express';
import { DashboardService } from './dashboard.service';
import { authenticate } from '../../middleware';
import { asyncHandler, sendSuccess } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';
import { Request, Response } from 'express';

const router = Router();
const service = new DashboardService();

router.use(authenticate);
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const data = await service.getSummary(userId);
  sendSuccess(res, data);
}));

export const dashboardRoutes = router;
export { DashboardService } from './dashboard.service';
