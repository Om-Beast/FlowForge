import { Router } from 'express';
import { authenticate } from '../../middleware';
import { asyncHandler } from '../../utils/async-wrapper.utils';
import { schedulerController } from './scheduler.controller';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(schedulerController.list.bind(schedulerController)));
router.post('/', asyncHandler(schedulerController.create.bind(schedulerController)));
router.get('/:id', asyncHandler(schedulerController.getById.bind(schedulerController)));
router.patch('/:id', asyncHandler(schedulerController.update.bind(schedulerController)));
router.delete('/:id', asyncHandler(schedulerController.remove.bind(schedulerController)));
router.post('/:id/pause', asyncHandler(schedulerController.pause.bind(schedulerController)));
router.post('/:id/resume', asyncHandler(schedulerController.resume.bind(schedulerController)));

export const schedulerRoutes = router;
