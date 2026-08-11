import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { EmailNodeData } from '../types';

const EmailNode = memo(function EmailNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as EmailNodeData;
  const { to, subject } = nodeData.config ?? {};

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {to ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', minWidth: 28 }}>TO</span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  flex: 1,
                }}
              >
                {String(to)}
              </span>
            </div>
            {subject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', minWidth: 28 }}>SUBJ</span>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {String(subject)}
                </span>
              </div>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Configure recipient…
          </span>
        )}
      </div>
    </BaseNodeShell>
  );
});

EmailNode.displayName = 'EmailNode';
export default EmailNode;
