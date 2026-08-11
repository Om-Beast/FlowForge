import { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import BaseNodeShell from './BaseNode';
import type { HttpRequestNodeData } from '../types';

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  PATCH: '#a855f7',
  DELETE: '#ef4444',
};

const HttpRequestNode = memo(function HttpRequestNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as HttpRequestNodeData;
  const { url, method = 'POST' } = nodeData.config ?? {};
  const methodStr = String(method).toUpperCase();
  const methodColor = METHOD_COLORS[methodStr] ?? '#64748b';

  // Trim URL for display
  let displayUrl = String(url ?? '');
  try {
    const parsed = new URL(displayUrl);
    displayUrl = parsed.hostname + (parsed.pathname !== '/' ? parsed.pathname : '');
  } catch {
    // not a valid URL, show as-is
  }

  return (
    <BaseNodeShell data={nodeData} selected={selected}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            fontSize: '0.5625rem',
            fontWeight: 700,
            padding: '0.15rem 0.375rem',
            borderRadius: 4,
            background: `${methodColor}20`,
            color: methodColor,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.04em',
            border: `1px solid ${methodColor}40`,
            flexShrink: 0,
          }}
        >
          {methodStr}
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            fontFamily: 'JetBrains Mono, monospace',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}
        >
          {displayUrl || 'https://…'}
        </span>
      </div>
    </BaseNodeShell>
  );
});

HttpRequestNode.displayName = 'HttpRequestNode';
export default HttpRequestNode;
