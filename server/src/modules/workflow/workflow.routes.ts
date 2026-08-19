import { Router } from 'express';
import { WorkflowController } from './workflow.controller';
import { authenticate } from '../../middleware';
import { validateBody, validateQuery } from '../../middleware';
import {
  createWorkflowSchema,
  updateWorkflowSchema,
  workflowQuerySchema,
  triggerExecutionSchema,
} from './workflow.schema';
import { asyncHandler } from '../../utils';
import { idempotency } from '../../middleware';

const router = Router();
const controller = new WorkflowController();

// All workflow routes require authentication
router.use(authenticate);

router.get('/', validateQuery(workflowQuerySchema), asyncHandler(controller.findAll.bind(controller)));
router.post('/', validateBody(createWorkflowSchema), asyncHandler(controller.create.bind(controller)));
router.post('/validate', asyncHandler(controller.validate.bind(controller)));
router.get('/:id/executions', asyncHandler(controller.getExecutions.bind(controller)));
router.get('/:id', asyncHandler(controller.findOne.bind(controller)));
router.patch('/:id', validateBody(updateWorkflowSchema), asyncHandler(controller.update.bind(controller)));
router.delete('/:id', asyncHandler(controller.delete.bind(controller)));
router.post('/:id/activate', asyncHandler(controller.activate.bind(controller)));
router.post('/:id/deactivate', asyncHandler(controller.deactivate.bind(controller)));
router.post(
  '/:id/execute',
  idempotency(),
  validateBody(triggerExecutionSchema),
  asyncHandler(controller.execute.bind(controller)),
);

export { router as workflowRoutes };
