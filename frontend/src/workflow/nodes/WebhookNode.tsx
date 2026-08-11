import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { WebhookNodeData } from '../types';

const WebhookNode = memo(function WebhookNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as WebhookNodeData;
  const method = nodeData.config?.method ?? 'POST';
  const path = nodeData.config?.path ?? '/webhook';

  return (
    <BaseNodeShell data={nodeData} selected={selected} hasTarget={false}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.125rem 0.375rem',
            borderRadius: 4,
            background: 'rgba(249, 115, 22, 0.15)',
            color: '#f97316',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.04em',
            border: '1px solid rgba(249, 115, 22, 0.3)',
          }}
        >
          {method}
        </span>
        <span
          style={{
            fontSize: '0.75rem',
            color: 'var(--color-text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {path}
        </span>
      </div>
    </BaseNodeShell>
  );
});

WebhookNode.displayName = 'WebhookNode';
export default WebhookNode;
