import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { TransformNodeData } from '../types';

const TransformNode = memo(function TransformNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as TransformNodeData;
  const { mapping, description } = nodeData.config ?? {};

  let mappingCount = 0;
  try {
    const parsed = JSON.parse(String(mapping ?? '{}'));
    mappingCount = Object.keys(parsed).length;
  } catch {
    mappingCount = 0;
  }

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {mappingCount > 0 ? (
          <>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#06b6d4',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {mappingCount}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {mappingCount === 1 ? 'field mapped' : 'fields mapped'}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {description ? String(description) : 'Configure mapping…'}
          </span>
        )}
      </div>
    </BaseNodeShell>
  );
});

TransformNode.displayName = 'TransformNode';
export default TransformNode;
