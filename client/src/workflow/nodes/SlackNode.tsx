import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { SlackNodeData } from '../types';

const SlackNode = memo(function SlackNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as SlackNodeData;
  const { channel, text } = nodeData.config ?? {};
  const channelStr = channel ? String(channel) : '';
  const textStr = text ? String(text) : '';

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {channelStr ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <span
                style={{
                  fontSize: '0.6875rem',
                  color: '#818cf8',
                  fontWeight: 600,
                  fontFamily: 'JetBrains Mono, monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {channelStr.startsWith('#') ? channelStr : `#${channelStr}`}
              </span>
            </div>
            {textStr && (
              <p
                style={{
                  fontSize: '0.6875rem',
                  color: 'var(--color-text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: 1.3,
                  maxWidth: 168,
                }}
              >
                {textStr.length > 48 ? textStr.slice(0, 48) + '…' : textStr}
              </p>
            )}
          </>
        ) : (
          <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
            Configure channel…
          </span>
        )}
      </div>
    </BaseNodeShell>
  );
});

SlackNode.displayName = 'SlackNode';
export default SlackNode;
