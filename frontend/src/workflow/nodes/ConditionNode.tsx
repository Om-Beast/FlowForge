import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { ConditionNodeData } from '../types';

const OPERATOR_LABELS: Record<string, string> = {
  eq: '==', ne: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=', contains: 'contains', exists: 'exists',
};

const ConditionNode = memo(function ConditionNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as ConditionNodeData;
  const { field, operator, value } = nodeData.config ?? {};
  const opLabel = OPERATOR_LABELS[operator ?? 'eq'] ?? operator ?? '==';

  return (
    <div style={{ position: 'relative' }}>
      {/* Custom diamond wrapper */}
      <BaseNodeShell data={nodeData} selected={selected} hasSource={false} hasTarget>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.75rem',
            flexWrap: 'wrap',
          }}
        >
          {field ? (
            <>
              <span style={{ color: '#a855f7', fontWeight: 600 }}>{String(field)}</span>
              <span style={{ color: 'var(--color-text-muted)', padding: '0 2px' }}>{opLabel}</span>
              <span style={{ color: 'var(--color-text-secondary)' }}>{String(value ?? '')}</span>
            </>
          ) : (
            <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontSize: '0.6875rem' }}>
              Configure condition…
            </span>
          )}
        </div>
      </BaseNodeShell>

      {/* Two source handles — true (right) and false (left) */}
      <Handle
        id="true_branch"
        type="source"
        position={Position.Bottom}
        style={{
          left: '30%',
          background: 'var(--color-surface-1)',
          border: '2px solid #10b981',
          width: 10,
          height: 10,
          bottom: -6,
        }}
      />
      <Handle
        id="false_branch"
        type="source"
        position={Position.Bottom}
        style={{
          left: '70%',
          background: 'var(--color-surface-1)',
          border: '2px solid #ef4444',
          width: 10,
          height: 10,
          bottom: -6,
        }}
      />

      {/* Branch labels */}
      <div
        style={{
          position: 'absolute',
          bottom: -22,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-around',
          paddingLeft: '8%',
          paddingRight: '8%',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontSize: '0.5625rem', color: '#10b981', fontWeight: 700 }}>TRUE</span>
        <span style={{ fontSize: '0.5625rem', color: '#ef4444', fontWeight: 700 }}>FALSE</span>
      </div>
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
export default ConditionNode;
