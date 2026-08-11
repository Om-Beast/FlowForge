interface WorkflowToolbarProps {
  workflowName: string;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onValidate: () => void;
  onExecute: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onAutoLayout: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  isSaving: boolean;
  isExecuting: boolean;
  isValidating: boolean;
  executionStatus?: 'idle' | 'running' | 'completed' | 'failed';
  saveStatus?: 'saved' | 'saving' | 'error' | 'unsaved';
  workflowStatus?: string;
}

const SAVE_LABELS = {
  saved: '✓ Saved',
  saving: 'Saving…',
  error: '✗ Error',
  unsaved: '● Unsaved',
};

const SAVE_COLORS = {
  saved: '#10b981',
  saving: '#3b82f6',
  error: '#ef4444',
  unsaved: '#f59e0b',
};

const EXEC_STATUS_COLORS = {
  idle: 'transparent',
  running: '#3b82f6',
  completed: '#10b981',
  failed: '#ef4444',
};

const EXEC_STATUS_LABELS = {
  idle: '',
  running: '⚡ Running…',
  completed: '✓ Completed',
  failed: '✗ Failed',
};

function ToolbarSeparator() {
  return (
    <div
      style={{
        width: 1,
        height: 20,
        background: 'var(--color-border)',
        flexShrink: 0,
      }}
    />
  );
}

function ToolBtn({
  onClick,
  disabled,
  title,
  children,
  variant = 'ghost',
  active = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  variant?: 'ghost' | 'primary' | 'success' | 'warning';
  active?: boolean;
}) {
  const bgMap = {
    ghost: active ? 'rgba(99,102,241,0.15)' : 'transparent',
    primary: 'var(--color-brand-600)',
    success: 'rgba(16,185,129,0.15)',
    warning: 'rgba(249,115,22,0.15)',
  };
  const colorMap = {
    ghost: active ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
    primary: '#fff',
    success: '#10b981',
    warning: '#f97316',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.625rem',
        borderRadius: 6,
        border: variant === 'primary' ? 'none' : '1px solid transparent',
        background: disabled ? 'transparent' : bgMap[variant],
        color: disabled ? 'var(--color-text-muted)' : colorMap[variant],
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '0.8125rem',
        fontWeight: variant === 'primary' ? 600 : 500,
        lineHeight: 1,
        transition: 'background 150ms ease, color 150ms ease',
        opacity: disabled ? 0.45 : 1,
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={(e) => {
        if (disabled) return;
        if (variant === 'ghost') (e.currentTarget).style.background = 'rgba(99,102,241,0.10)';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        if (variant === 'ghost') (e.currentTarget).style.background = active ? 'rgba(99,102,241,0.15)' : 'transparent';
      }}
    >
      {children}
    </button>
  );
}

export default function WorkflowToolbar({
  workflowName,
  onNameChange,
  onSave,
  onValidate,
  onExecute,
  onUndo,
  onRedo,
  onAutoLayout,
  canUndo,
  canRedo,
  isDirty,
  isSaving,
  isExecuting,
  isValidating,
  executionStatus = 'idle',
  saveStatus = 'saved',
  workflowStatus,
}: WorkflowToolbarProps) {
  const displaySaveStatus = isSaving ? 'saving' : saveStatus;

  return (
    <header
      style={{
        height: 52,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0 1rem',
        background: 'var(--color-surface-2)',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.2)',
        zIndex: 10,
      }}
    >
      {/* Breadcrumb back */}
      <a
        href="/workflows"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--color-text-muted)',
          textDecoration: 'none',
          fontSize: '0.8125rem',
          padding: '0.25rem',
          borderRadius: 4,
          transition: 'color 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { (e.currentTarget).style.color = 'var(--color-text-primary)'; }}
        onMouseLeave={(e) => { (e.currentTarget).style.color = 'var(--color-text-muted)'; }}
      >
        ← Workflows
      </a>

      <ToolbarSeparator />

      {/* Editable workflow name */}
      <input
        type="text"
        value={workflowName}
        onChange={(e) => onNameChange(e.target.value)}
        style={{
          background: 'none',
          border: 'none',
          outline: 'none',
          fontSize: '0.9375rem',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
          minWidth: 120,
          maxWidth: 260,
          flex: '0 1 auto',
        }}
        onFocus={(e) => { (e.currentTarget).style.borderBottom = '1px solid var(--color-brand-400)'; }}
        onBlur={(e) => { (e.currentTarget).style.borderBottom = 'none'; }}
      />

      {/* Workflow status badge */}
      {workflowStatus && (
        <span
          style={{
            fontSize: '0.625rem',
            fontWeight: 700,
            padding: '0.2rem 0.5rem',
            borderRadius: 100,
            background:
              workflowStatus === 'ACTIVE' ? 'rgba(16,185,129,0.15)' :
              workflowStatus === 'DRAFT'  ? 'rgba(234,179,8,0.15)' :
              'rgba(100,116,139,0.15)',
            color:
              workflowStatus === 'ACTIVE' ? '#10b981' :
              workflowStatus === 'DRAFT'  ? '#eab308' :
              '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flexShrink: 0,
          }}
        >
          {workflowStatus}
        </span>
      )}

      {/* Save status indicator */}
      {(isDirty || displaySaveStatus !== 'saved') && (
        <span
          style={{
            fontSize: '0.6875rem',
            color: SAVE_COLORS[displaySaveStatus],
            flexShrink: 0,
          }}
        >
          {SAVE_LABELS[displaySaveStatus]}
        </span>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Undo / Redo */}
      <ToolBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
        ↩ Undo
      </ToolBtn>
      <ToolBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
        Redo ↪
      </ToolBtn>

      <ToolbarSeparator />

      {/* Auto-layout */}
      <ToolBtn onClick={onAutoLayout} title="Auto-layout (top-to-bottom DAG)">
        ⊞ Layout
      </ToolBtn>

      <ToolbarSeparator />

      {/* Validate */}
      <ToolBtn onClick={onValidate} disabled={isValidating} title="Validate DAG structure" variant="ghost">
        {isValidating ? '…' : '✓'} Validate
      </ToolBtn>

      {/* Execute */}
      <ToolBtn onClick={onExecute} disabled={isExecuting} title="Execute workflow" variant="warning">
        {isExecuting ? (
          <>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f97316', animation: 'pulse-blue 1s infinite' }} />
            Running
          </>
        ) : (
          '▷ Run'
        )}
      </ToolBtn>

      {/* Save */}
      <ToolBtn onClick={onSave} disabled={isSaving} title="Save workflow (Ctrl+S)" variant="primary">
        {isSaving ? '…' : '↑'} Save
      </ToolBtn>

      {/* Execution status pill */}
      {executionStatus !== 'idle' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            borderRadius: 100,
            background: `${EXEC_STATUS_COLORS[executionStatus]}15`,
            border: `1px solid ${EXEC_STATUS_COLORS[executionStatus]}40`,
            fontSize: '0.6875rem',
            color: EXEC_STATUS_COLORS[executionStatus],
            fontWeight: 600,
            flexShrink: 0,
          }}
        >
          {executionStatus === 'running' && (
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', display: 'inline-block', animation: 'pulse-blue 1s infinite' }} />
          )}
          {EXEC_STATUS_LABELS[executionStatus]}
        </div>
      )}
    </header>
  );
}
