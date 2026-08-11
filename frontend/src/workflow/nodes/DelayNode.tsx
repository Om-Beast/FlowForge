import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { DelayNodeData } from '../types';

function formatDelay(delayMs: number, unit?: string): string {
  if (unit === 'minutes') return `${delayMs / 60000} min`;
  if (unit === 'seconds') return `${delayMs / 1000}s`;
  return `${delayMs}ms`;
}

const DelayNode = memo(function DelayNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as DelayNodeData;
  const { delayMs = 1000, unit } = nodeData.config ?? {};
  const label = formatDelay(Number(delayMs), unit as string | undefined);

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}
      >
        <span style={{ fontSize: '1rem' }}>⏳</span>
        <span
          style={{
            fontSize: '0.9375rem',
            fontWeight: 700,
            color: '#eab308',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        >
          {label}
        </span>
      </div>
    </BaseNodeShell>
  );
});

DelayNode.displayName = 'DelayNode';
export default DelayNode;
