import { useCallback } from 'react';
import { NODE_PALETTE, NODE_CATEGORIES } from './nodeRegistry';
import type { FlowNodeType } from './types';

interface NodePaletteProps {
  disabled?: boolean;
}

function PaletteCard({
  type,
  label,
  description,
  icon,
  color,
  accentColor,
  disabled,
}: {
  type: FlowNodeType;
  label: string;
  description: string;
  icon: string;
  color: string;
  accentColor: string;
  disabled?: boolean;
}) {
  const onDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.dataTransfer.setData('application/reactflow-node-type', type);
      e.dataTransfer.effectAllowed = 'move';
    },
    [type],
  );

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.625rem',
        padding: '0.5rem 0.625rem',
        borderRadius: 8,
        border: `1px solid rgba(99, 102, 241, 0.12)`,
        background: 'var(--color-surface-3)',
        cursor: disabled ? 'not-allowed' : 'grab',
        opacity: disabled ? 0.5 : 1,
        transition: 'border-color 150ms ease, background 150ms ease, transform 150ms ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}50`;
        (e.currentTarget as HTMLDivElement).style.background = accentColor;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(99, 102, 241, 0.12)';
        (e.currentTarget as HTMLDivElement).style.background = 'var(--color-surface-3)';
        (e.currentTarget as HTMLDivElement).style.transform = 'translateX(0)';
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          background: `${color}20`,
          border: `1px solid ${color}35`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.2,
            marginBottom: 1,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '0.6875rem',
            color: 'var(--color-text-muted)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {description}
        </div>
      </div>

      {/* Drag handle indicator */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          padding: '2px 1px',
          opacity: 0.35,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{ display: 'flex', gap: 3 }}
          >
            {[0, 1].map((j) => (
              <div
                key={j}
                style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--color-text-muted)' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NodePalette({ disabled }: NodePaletteProps) {
  return (
    <aside
      style={{
        width: 248,
        minWidth: 248,
        height: '100%',
        background: 'var(--color-surface-2)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '0.875rem 1rem 0.625rem',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 2 }}>
          Node Palette
        </div>
        <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
          Drag nodes onto the canvas
        </div>
      </div>

      {/* Scrollable node list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.625rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {NODE_CATEGORIES.map((cat) => {
          const nodes = NODE_PALETTE.filter((n) => n.category === cat.key);
          if (nodes.length === 0) return null;
          return (
            <div key={cat.key}>
              {/* Category header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem',
                  marginBottom: '0.375rem',
                  paddingBottom: '0.25rem',
                  borderBottom: `1px solid ${cat.color}25`,
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    color: cat.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  {cat.label}
                </span>
              </div>

              {/* Nodes in this category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {nodes.map((n) => (
                  <PaletteCard
                    key={n.type}
                    type={n.type}
                    label={n.label}
                    description={n.description}
                    icon={n.icon}
                    color={n.color}
                    accentColor={n.accentColor}
                    disabled={disabled}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer tip */}
      <div
        style={{
          padding: '0.625rem 0.75rem',
          borderTop: '1px solid var(--color-border)',
          background: 'rgba(99, 102, 241, 0.04)',
          flexShrink: 0,
        }}
      >
        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', lineHeight: 1.5, textAlign: 'center' }}>
          💡 Hold <kbd style={{ padding: '1px 4px', borderRadius: 3, background: 'var(--color-surface-4)', fontSize: '0.625rem', border: '1px solid var(--color-border)' }}>Shift</kbd> to multi-select
        </p>
      </div>
    </aside>
  );
}
