import { WorkflowStatus, NodeType, TriggerType } from '../../shared/enums';

export interface WorkflowNodeConfig {
  // Webhook node
  path?: string;
  method?: string;
  // Condition node
  field?: string;
  operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
  value?: unknown;
  // Delay node
  delayMs?: number;
  // Email node
  to?: string;
  subject?: string;
  body?: string;
  // HTTP Request node
  url?: string;
  headers?: Record<string, string>;
  payload?: Record<string, unknown>;
  // Slack node
  channel?: string;
  text?: string;
  webhookUrl?: string;
  // Transform node
  mapping?: Record<string, string>;
  // Filter node
  conditions?: Array<{ field: string; operator: string; value: unknown }>;
}

export interface WorkflowNode {
  id: string;
  type: NodeType;
  label: string;
  config: WorkflowNodeConfig;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: 'true_branch' | 'false_branch' | string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface CreateWorkflowDto {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType?: TriggerType;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  definition?: WorkflowDefinition;
  status?: WorkflowStatus;
  triggerType?: TriggerType;
}

export interface WorkflowFilter {
  status?: WorkflowStatus;
  search?: string;
  userId?: string;
}

export interface WorkflowDto {
  id: string;
  name: string;
  description: string | null;
  definition: WorkflowDefinition;
  status: WorkflowStatus;
  triggerType: TriggerType;
  version: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  _count?: { executions: number };
}

export interface DagValidationResult {
  isValid: boolean;
  errors: string[];
}
