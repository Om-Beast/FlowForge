import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { FilterNodeData } from '../types';

const FilterNode = memo(function FilterNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FilterNodeData;
  const { conditions, description } = nodeData.config ?? {};

  let conditionCount = 0;
  try {
    const parsed = JSON.parse(String(conditions ?? '[]'));
    conditionCount = Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    conditionCount = 0;
  }

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {conditionCount > 0 ? (
          <>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#ef4444',
                fontFamily: 'JetBrains Mono, monospace',
              }}
            >
              {conditionCount}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
              {conditionCount === 1 ? 'condition' : 'conditions'}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            {description ? String(description) : 'Configure filters…'}
          </span>
        )}
      </div>
    </BaseNodeShell>
  );
});

FilterNode.displayName = 'FilterNode';
export default FilterNode;
