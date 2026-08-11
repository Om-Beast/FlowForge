import { Router } from 'express';
import { queueService } from './queue.service';
import { authenticate, authorize } from '../../middleware';
import { asyncHandler, sendSuccess } from '../../utils';
import { UserRole } from '../../shared/enums';
import { Request, Response } from 'express';

const router = Router();

router.use(authenticate);

router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const stats = await queueService.getStats();
  sendSuccess(res, stats);
}));

router.get('/failed', authorize(UserRole.ADMIN), asyncHandler(async (_req: Request, res: Response) => {
  const jobs = await queueService.getFailedJobs();
  sendSuccess(res, jobs.map((j) => ({
    id: j.id,
    name: j.name,
    data: j.data,
    failedReason: j.failedReason,
    attemptsMade: j.attemptsMade,
  })));
}));

router.post('/pause', authorize(UserRole.ADMIN), asyncHandler(async (_req: Request, res: Response) => {
  await queueService.pauseQueue();
  sendSuccess(res, { paused: true });
}));

router.post('/resume', authorize(UserRole.ADMIN), asyncHandler(async (_req: Request, res: Response) => {
  await queueService.resumeQueue();
  sendSuccess(res, { paused: false });
}));

router.post('/jobs/:jobId/retry', authorize(UserRole.ADMIN), asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params as { jobId: string };
  await queueService.retryFailedJob(jobId);
  sendSuccess(res, { retried: true, jobId });
}));

export const queueRoutes = router;
export { queueService } from './queue.service';
export type { EnqueueJobOptions, QueueStats } from './queue.service';
