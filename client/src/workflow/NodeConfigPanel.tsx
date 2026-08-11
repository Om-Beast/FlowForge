import { useCallback } from 'react';
import { getNodeDef } from './nodeRegistry';
import type { FlowNode, FlowNodeType } from './types';

interface NodeConfigPanelProps {
  selectedNode: FlowNode | null;
  onUpdateConfig: (nodeId: string, config: Record<string, unknown>, label?: string) => void;
  onClose: () => void;
}

// ─── Reusable field components ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <label style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function TextInput({
  value, onChange, placeholder, type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="input-base"
      style={{ fontSize: '0.8125rem' }}
    />
  );
}

function TextArea({
  value, onChange, placeholder, rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="input-base"
      style={{ fontSize: '0.8125rem', resize: 'vertical', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1.5 }}
    />
  );
}

function SelectInput({
  value, onChange, options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-base"
      style={{ fontSize: '0.8125rem' }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

// ─── Per-type config forms ─────────────────────────────────────────────────────

function WebhookConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="HTTP Method">
        <SelectInput
          value={String(config['method'] ?? 'POST')}
          onChange={(v) => set('method', v)}
          options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ value: m, label: m }))}
        />
      </Field>
      <Field label="Path">
        <TextInput value={String(config['path'] ?? '')} onChange={(v) => set('path', v)} placeholder="/webhook" />
      </Field>
      <Field label="Description">
        <TextArea value={String(config['description'] ?? '')} onChange={(v) => set('description', v)} placeholder="What does this webhook do?" rows={2} />
      </Field>
    </>
  );
}

function ConditionConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="Field Path">
        <TextInput value={String(config['field'] ?? '')} onChange={(v) => set('field', v)} placeholder="data.status" />
      </Field>
      <Field label="Operator">
        <SelectInput
          value={String(config['operator'] ?? 'eq')}
          onChange={(v) => set('operator', v)}
          options={[
            { value: 'eq', label: '== equals' },
            { value: 'ne', label: '!= not equals' },
            { value: 'gt', label: '> greater than' },
            { value: 'gte', label: '>= greater or equal' },
            { value: 'lt', label: '< less than' },
            { value: 'lte', label: '<= less or equal' },
            { value: 'contains', label: 'contains (string)' },
            { value: 'exists', label: 'exists (not null)' },
          ]}
        />
      </Field>
      <Field label="Value">
        <TextInput value={String(config['value'] ?? '')} onChange={(v) => set('value', v)} placeholder="active" />
      </Field>
      <div style={{ padding: '0.5rem 0.625rem', borderRadius: 6, background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.2)', fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        💡 Two output edges: <strong style={{ color: '#10b981' }}>TRUE</strong> (left handle) and <strong style={{ color: '#ef4444' }}>FALSE</strong> (right handle)
      </div>
    </>
  );
}

function DelayConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  const unit = String(config['unit'] ?? 'ms');
  const rawMs = Number(config['delayMs'] ?? 1000);
  const displayValue = unit === 'minutes' ? rawMs / 60000 : unit === 'seconds' ? rawMs / 1000 : rawMs;

  const handleValueChange = useCallback((v: string) => {
    const num = parseFloat(v) || 0;
    const ms = unit === 'minutes' ? num * 60000 : unit === 'seconds' ? num * 1000 : num;
    set('delayMs', Math.max(0, Math.round(ms)));
  }, [unit, set]);

  return (
    <>
      <Field label="Duration">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="number"
            value={displayValue}
            onChange={(e) => handleValueChange(e.target.value)}
            min={0}
            className="input-base"
            style={{ flex: 1, fontSize: '0.8125rem' }}
          />
          <SelectInput
            value={unit}
            onChange={(v) => set('unit', v)}
            options={[
              { value: 'ms', label: 'ms' },
              { value: 'seconds', label: 'sec' },
              { value: 'minutes', label: 'min' },
            ]}
          />
        </div>
      </Field>
      <div style={{ padding: '0.5rem 0.625rem', borderRadius: 6, background: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.2)', fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
        ⏱ Maximum delay: <strong>30 seconds</strong> (enforced by worker)
      </div>
    </>
  );
}

function EmailConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="To (Email Address)">
        <TextInput value={String(config['to'] ?? '')} onChange={(v) => set('to', v)} placeholder="user@example.com" type="email" />
      </Field>
      <Field label="Subject">
        <TextInput value={String(config['subject'] ?? '')} onChange={(v) => set('subject', v)} placeholder="Your notification subject" />
      </Field>
      <Field label="Body">
        <TextArea value={String(config['body'] ?? '')} onChange={(v) => set('body', v)} placeholder="Email body content…" rows={4} />
      </Field>
    </>
  );
}

function HttpRequestConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="URL">
        <TextInput value={String(config['url'] ?? '')} onChange={(v) => set('url', v)} placeholder="https://api.example.com/endpoint" />
      </Field>
      <Field label="Method">
        <SelectInput
          value={String(config['method'] ?? 'POST')}
          onChange={(v) => set('method', v)}
          options={['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((m) => ({ value: m, label: m }))}
        />
      </Field>
      <Field label="Headers (JSON)">
        <TextArea value={String(config['headers'] ?? '')} onChange={(v) => set('headers', v)} placeholder={'{\n  "Authorization": "Bearer token"\n}'} rows={3} />
      </Field>
      <Field label="Payload (JSON)">
        <TextArea value={String(config['payload'] ?? '')} onChange={(v) => set('payload', v)} placeholder={'{\n  "key": "value"\n}'} rows={3} />
      </Field>
    </>
  );
}

function SlackConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="Channel">
        <TextInput value={String(config['channel'] ?? '')} onChange={(v) => set('channel', v)} placeholder="#notifications" />
      </Field>
      <Field label="Message">
        <TextArea value={String(config['text'] ?? '')} onChange={(v) => set('text', v)} placeholder="Workflow execution completed! 🎉" rows={3} />
      </Field>
      <Field label="Webhook URL (optional)">
        <TextInput value={String(config['webhookUrl'] ?? '')} onChange={(v) => set('webhookUrl', v)} placeholder="https://hooks.slack.com/services/…" />
      </Field>
    </>
  );
}

function TransformConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="Description">
        <TextInput value={String(config['description'] ?? '')} onChange={(v) => set('description', v)} placeholder="What does this transform do?" />
      </Field>
      <Field label="Field Mapping (JSON object)">
        <TextArea value={String(config['mapping'] ?? '{}')} onChange={(v) => set('mapping', v)} placeholder={'{\n  "outputField": "input.sourceField"\n}'} rows={6} />
      </Field>
      <div style={{ padding: '0.5rem 0.625rem', borderRadius: 6, background: 'rgba(6, 182, 212, 0.08)', border: '1px solid rgba(6, 182, 212, 0.2)', fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        💡 Keys = output field names, values = dot-path from input context
      </div>
    </>
  );
}

function FilterConfig({ config, onChange }: { config: Record<string, unknown>; onChange: (c: Record<string, unknown>) => void }) {
  const set = useCallback((key: string, val: unknown) => onChange({ ...config, [key]: val }), [config, onChange]);
  return (
    <>
      <Field label="Description">
        <TextInput value={String(config['description'] ?? '')} onChange={(v) => set('description', v)} placeholder="What does this filter do?" />
      </Field>
      <Field label="Conditions (JSON array)">
        <TextArea
          value={String(config['conditions'] ?? '[]')}
          onChange={(v) => set('conditions', v)}
          placeholder={'[\n  { "field": "status", "operator": "eq", "value": "active" }\n]'}
          rows={6}
        />
      </Field>
      <div style={{ padding: '0.5rem 0.625rem', borderRadius: 6, background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.6875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
        Operators: <code>eq</code>, <code>ne</code>, <code>gt</code>, <code>lt</code>
      </div>
    </>
  );
}

// ─── Config form dispatcher ────────────────────────────────────────────────────

function ConfigForm({
  nodeType,
  config,
  onChange,
}: {
  nodeType: FlowNodeType;
  config: Record<string, unknown>;
  onChange: (c: Record<string, unknown>) => void;
}) {
  switch (nodeType) {
    case 'WEBHOOK':        return <WebhookConfig config={config} onChange={onChange} />;
    case 'CONDITION':      return <ConditionConfig config={config} onChange={onChange} />;
    case 'DELAY':          return <DelayConfig config={config} onChange={onChange} />;
    case 'EMAIL':          return <EmailConfig config={config} onChange={onChange} />;
    case 'HTTP_REQUEST':   return <HttpRequestConfig config={config} onChange={onChange} />;
    case 'SLACK':          return <SlackConfig config={config} onChange={onChange} />;
    case 'TRANSFORM':      return <TransformConfig config={config} onChange={onChange} />;
    case 'FILTER':         return <FilterConfig config={config} onChange={onChange} />;
    default:               return <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>No configuration for this node type.</p>;
  }
}

// ─── Main panel ────────────────────────────────────────────────────────────────

export default function NodeConfigPanel({ selectedNode, onUpdateConfig, onClose }: NodeConfigPanelProps) {
  const def = selectedNode ? getNodeDef(selectedNode.data.nodeType) : null;

  const handleConfigChange = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedNode) return;
      onUpdateConfig(selectedNode.id, config);
    },
    [selectedNode, onUpdateConfig],
  );

  const handleLabelChange = useCallback(
    (label: string) => {
      if (!selectedNode) return;
      onUpdateConfig(selectedNode.id, selectedNode.data.config, label);
    },
    [selectedNode, onUpdateConfig],
  );

  if (!selectedNode || !def) {
    return (
      <aside
        style={{
          width: 300,
          minWidth: 300,
          height: '100%',
          background: 'var(--color-surface-2)',
          borderLeft: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '0.75rem',
          padding: '2rem',
        }}
      >
        <div style={{ fontSize: '2rem', opacity: 0.2 }}>◆</div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
          Click a node to configure its properties
        </p>
      </aside>
    );
  }

  return (
    <aside
      style={{
        width: 300,
        minWidth: 300,
        height: '100%',
        background: 'var(--color-surface-2)',
        borderLeft: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Panel header */}
      <div
        style={{
          padding: '0.75rem 1rem',
          borderBottom: '1px solid var(--color-border)',
          background: def.accentColor,
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
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
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.625rem', fontWeight: 700, color: def.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {def.label}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace' }}>
            {selectedNode.id.slice(0, 16)}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            fontSize: '1rem',
            padding: '0.25rem',
            borderRadius: 4,
            flexShrink: 0,
            lineHeight: 1,
          }}
          aria-label="Close config panel"
        >
          ✕
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
        {/* Node Label */}
        <Field label="Node Label">
          <TextInput
            value={selectedNode.data.label}
            onChange={handleLabelChange}
            placeholder="Enter a label for this node"
          />
        </Field>

        <div style={{ height: 1, background: 'var(--color-border)', margin: '0.125rem 0' }} />

        {/* Type-specific fields */}
        <ConfigForm
          nodeType={selectedNode.data.nodeType}
          config={selectedNode.data.config}
          onChange={handleConfigChange}
        />

        {/* Node ID (read-only info) */}
        <div style={{ marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ fontSize: '0.5625rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Node ID</div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontFamily: 'JetBrains Mono, monospace', wordBreak: 'break-all' }}>
            {selectedNode.id}
          </div>
        </div>
      </div>
    </aside>
  );
}
