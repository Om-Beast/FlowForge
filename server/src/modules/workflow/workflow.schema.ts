import { z } from 'zod';
import { NodeType, TriggerType, WorkflowStatus } from '../../shared/enums';

const workflowNodeSchema = z.object({
  id: z.string().min(1),
  type: z.nativeEnum(NodeType),
  label: z.string().min(1).max(100),
  config: z.record(z.unknown()),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
});

const workflowEdgeSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  condition: z.string().optional(),
});

const workflowDefinitionSchema = z.object({
  nodes: z.array(workflowNodeSchema).min(1, 'Workflow must have at least one node'),
  edges: z.array(workflowEdgeSchema),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional(),
  definition: workflowDefinitionSchema,
  triggerType: z.nativeEnum(TriggerType).optional(),
});

export const updateWorkflowSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  definition: workflowDefinitionSchema.optional(),
  status: z.nativeEnum(WorkflowStatus).optional(),
  triggerType: z.nativeEnum(TriggerType).optional(),
});

export const workflowQuerySchema = z.object({
  status: z.nativeEnum(WorkflowStatus).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const triggerExecutionSchema = z.object({
  input: z.record(z.unknown()).optional(),
  priority: z.number().int().min(1).max(5).optional(),
});

export type CreateWorkflowInput = z.infer<typeof createWorkflowSchema>;
export type UpdateWorkflowInput = z.infer<typeof updateWorkflowSchema>;
export type WorkflowQueryInput = z.infer<typeof workflowQuerySchema>;
export type TriggerExecutionInput = z.infer<typeof triggerExecutionSchema>;
