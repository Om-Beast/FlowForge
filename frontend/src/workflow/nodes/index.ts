import type { NodeTypes } from '@xyflow/react';

export { default as WebhookNode } from './WebhookNode';
export { default as ConditionNode } from './ConditionNode';
export { default as DelayNode } from './DelayNode';
export { default as EmailNode } from './EmailNode';
export { default as HttpRequestNode } from './HttpRequestNode';
export { default as SlackNode } from './SlackNode';
export { default as TransformNode } from './TransformNode';
export { default as FilterNode } from './FilterNode';
export { default as BaseNodeShell } from './BaseNode';

import WebhookNode from './WebhookNode';
import ConditionNode from './ConditionNode';
import DelayNode from './DelayNode';
import EmailNode from './EmailNode';
import HttpRequestNode from './HttpRequestNode';
import SlackNode from './SlackNode';
import TransformNode from './TransformNode';
import FilterNode from './FilterNode';

/**
 * React Flow nodeTypes map.
 * Keys must exactly match the FlowNodeType values so React Flow
 * can resolve the correct component for each node.
 */
export const NODE_TYPES: NodeTypes = {
  WEBHOOK: WebhookNode,
  CONDITION: ConditionNode,
  DELAY: DelayNode,
  EMAIL: EmailNode,
  HTTP_REQUEST: HttpRequestNode,
  SLACK: SlackNode,
  TRANSFORM: TransformNode,
  FILTER: FilterNode,
};
