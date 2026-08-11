import { Router } from 'express';
import { NotificationService } from './notification.service';
import { authenticate } from '../../middleware';
import { asyncHandler, sendSuccess, sendNoContent } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';
import { Request, Response } from 'express';

const router = Router();
const service = new NotificationService();

router.use(authenticate);

router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const unreadOnly = req.query['unreadOnly'] === 'true';
  const page = parseInt((req.query['page'] as string) ?? '1', 10);
  const limit = parseInt((req.query['limit'] as string) ?? '20', 10);
  const result = await service.getAll(userId, page, limit, unreadOnly);
  sendSuccess(res, result.data, { meta: result.meta });
}));

router.get('/unread-count', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  const count = await service.getUnreadCount(userId);
  sendSuccess(res, { count });
}));

router.patch('/:id/read', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  await service.markRead((req.params as { id: string }).id, userId);
  sendNoContent(res);
}));

router.post('/mark-all-read', asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = (req as AuthenticatedRequest).user;
  await service.markAllRead(userId);
  sendNoContent(res);
}));

export const notificationRoutes = router;
export { NotificationService } from './notification.service';
