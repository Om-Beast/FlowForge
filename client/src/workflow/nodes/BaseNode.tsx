import { memo, type ReactNode } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { AnyNodeData } from '../types';
import { getNodeDef } from '../nodeRegistry';

interface BaseNodeShellProps {
  data: AnyNodeData;
  selected?: boolean;
  hasTarget?: boolean;
  hasSource?: boolean;
  children?: ReactNode;
  /** Override the subtitle line below the label */
  subtitle?: string;
}

export const BaseNodeShell = memo(function BaseNodeShell({
  data,
  selected = false,
  hasTarget = true,
  hasSource = true,
  children,
  subtitle,
}: BaseNodeShellProps) {
  const def = getNodeDef(data.nodeType);

  const borderColor = data.hasError
    ? '#ef4444'
    : data.isFailed
    ? '#ef4444'
    : selected
    ? def.color
    : 'rgba(99, 102, 241, 0.2)';

  const glowShadow = selected
    ? `0 0 0 2px ${def.color}40, 0 8px 32px rgba(0,0,0,0.5)`
    : '0 4px 24px rgba(0,0,0,0.4)';

  const statusColor = data.isRunning
    ? '#3b82f6'
    : data.isCompleted
    ? '#10b981'
    : data.isFailed
    ? '#ef4444'
    : null;

  return (
    <div
      style={{
        minWidth: 200,
        background: 'var(--color-surface-3)',
        border: `1.5px solid ${borderColor}`,
        borderRadius: 12,
        boxShadow: glowShadow,
        transition: 'box-shadow 200ms ease, border-color 200ms ease',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Running animation — top bar pulse */}
      {data.isRunning && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
            animation: 'node-scan 1.5s linear infinite',
          }}
        />
      )}

      {/* Status indicator bar */}
      {statusColor && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: statusColor,
            borderRadius: '12px 0 0 12px',
          }}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.875rem 0.5rem',
          borderBottom: `1px solid rgba(99, 102, 241, 0.1)`,
          background: def.accentColor,
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            background: `${def.color}25`,
            border: `1px solid ${def.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.875rem',
            flexShrink: 0,
          }}
        >
          {def.icon}
        </span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: def.color,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              lineHeight: 1,
            }}
          >
            {def.label}
          </div>
          <div
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.3,
              marginTop: 2,
            }}
          >
            {data.label}
          </div>
        </div>

        {/* Status icon */}
        {data.isRunning && (
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', animation: 'pulse-blue 1s infinite', flexShrink: 0 }} />
        )}
        {data.isCompleted && (
          <span style={{ color: '#10b981', fontSize: '0.75rem', flexShrink: 0 }}>✓</span>
        )}
        {(data.isFailed || data.hasError) && (
          <span style={{ color: '#ef4444', fontSize: '0.75rem', flexShrink: 0 }}>✗</span>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '0.625rem 0.875rem' }}>
        {subtitle && (
          <p
            style={{
              fontSize: '0.75rem',
              color: 'var(--color-text-muted)',
              lineHeight: 1.4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>

      {/* Handles */}
      {hasTarget && (
        <Handle
          type="target"
          position={Position.Top}
          style={{
            background: 'var(--color-surface-1)',
            border: `2px solid ${def.color}`,
            width: 10,
            height: 10,
            top: -6,
          }}
        />
      )}
      {hasSource && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{
            background: 'var(--color-surface-1)',
            border: `2px solid ${def.color}`,
            width: 10,
            height: 10,
            bottom: -6,
          }}
        />
      )}
    </div>
  );
});

export default BaseNodeShell;
