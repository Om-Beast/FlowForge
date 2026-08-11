import type { Node, Edge } from '@xyflow/react';

// ─── Node Types ───────────────────────────────────────────────────────────────

export type FlowNodeType =
  | 'WEBHOOK'
  | 'CONDITION'
  | 'DELAY'
  | 'EMAIL'
  | 'HTTP_REQUEST'
  | 'SLACK'
  | 'TRANSFORM'
  | 'FILTER';

// ─── Node Data ────────────────────────────────────────────────────────────────

export interface BaseNodeData extends Record<string, unknown> {
  label: string;
  nodeType: FlowNodeType;
  config: Record<string, unknown>;
  isSelected?: boolean;
  hasError?: boolean;
  isRunning?: boolean;
  isCompleted?: boolean;
  isFailed?: boolean;
}

export interface WebhookNodeData extends BaseNodeData {
  nodeType: 'WEBHOOK';
  config: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    path?: string;
    description?: string;
  };
}

export interface ConditionNodeData extends BaseNodeData {
  nodeType: 'CONDITION';
  config: {
    field?: string;
    operator?: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'exists';
    value?: string | number | boolean;
  };
}

export interface DelayNodeData extends BaseNodeData {
  nodeType: 'DELAY';
  config: {
    delayMs?: number;
    unit?: 'ms' | 'seconds' | 'minutes';
  };
}

export interface EmailNodeData extends BaseNodeData {
  nodeType: 'EMAIL';
  config: {
    to?: string;
    subject?: string;
    body?: string;
  };
}

export interface HttpRequestNodeData extends BaseNodeData {
  nodeType: 'HTTP_REQUEST';
  config: {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: string;
    payload?: string;
  };
}

export interface SlackNodeData extends BaseNodeData {
  nodeType: 'SLACK';
  config: {
    channel?: string;
    text?: string;
    webhookUrl?: string;
  };
}

export interface TransformNodeData extends BaseNodeData {
  nodeType: 'TRANSFORM';
  config: {
    mapping?: string;
    description?: string;
  };
}

export interface FilterNodeData extends BaseNodeData {
  nodeType: 'FILTER';
  config: {
    conditions?: string;
    description?: string;
  };
}

export type AnyNodeData =
  | WebhookNodeData
  | ConditionNodeData
  | DelayNodeData
  | EmailNodeData
  | HttpRequestNodeData
  | SlackNodeData
  | TransformNodeData
  | FilterNodeData;

// ─── React Flow Node / Edge ───────────────────────────────────────────────────

export type FlowNode = Node<AnyNodeData, FlowNodeType>;
export type FlowEdge = Edge<{ condition?: string }>;

// ─── Node Palette Definition ──────────────────────────────────────────────────

export interface NodePaletteItem {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  category: 'trigger' | 'logic' | 'action' | 'transform';
  defaultConfig: Record<string, unknown>;
}

// ─── Builder History ──────────────────────────────────────────────────────────

export interface HistorySnapshot {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// ─── Execution State ──────────────────────────────────────────────────────────

export interface ExecutionStepEvent {
  executionId: string;
  workflowId: string;
  stepId: string;
  nodeId: string;
  nodeType: string;
  status: 'COMPLETED' | 'FAILED' | 'RUNNING';
  output?: Record<string, unknown>;
  error?: string;
  userId: string;
}
