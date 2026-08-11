import type { NodePaletteItem, FlowNodeType } from './types';

// ─── Node Registry ────────────────────────────────────────────────────────────
// Single source of truth for all node type definitions.
// Used by the palette, node components, and config panel.

export const NODE_PALETTE: NodePaletteItem[] = [
  {
    type: 'WEBHOOK',
    label: 'Webhook',
    description: 'Trigger via HTTP request',
    icon: '⚡',
    color: '#f97316',
    accentColor: 'rgba(249, 115, 22, 0.15)',
    category: 'trigger',
    defaultConfig: { method: 'POST', path: '/webhook', description: '' },
  },
  {
    type: 'HTTP_REQUEST',
    label: 'HTTP Request',
    description: 'Call an external API',
    icon: '🌐',
    color: '#3b82f6',
    accentColor: 'rgba(59, 130, 246, 0.15)',
    category: 'action',
    defaultConfig: { url: '', method: 'POST', headers: '', payload: '' },
  },
  {
    type: 'CONDITION',
    label: 'Condition',
    description: 'Branch based on a value',
    icon: '◀▶',
    color: '#a855f7',
    accentColor: 'rgba(168, 85, 247, 0.15)',
    category: 'logic',
    defaultConfig: { field: '', operator: 'eq', value: '' },
  },
  {
    type: 'DELAY',
    label: 'Delay',
    description: 'Wait before continuing',
    icon: '⏳',
    color: '#eab308',
    accentColor: 'rgba(234, 179, 8, 0.15)',
    category: 'logic',
    defaultConfig: { delayMs: 1000, unit: 'ms' },
  },
  {
    type: 'EMAIL',
    label: 'Send Email',
    description: 'Send an email notification',
    icon: '✉',
    color: '#10b981',
    accentColor: 'rgba(16, 185, 129, 0.15)',
    category: 'action',
    defaultConfig: { to: '', subject: '', body: '' },
  },
  {
    type: 'SLACK',
    label: 'Slack',
    description: 'Send a Slack message',
    icon: '💬',
    color: '#818cf8',
    accentColor: 'rgba(129, 140, 248, 0.15)',
    category: 'action',
    defaultConfig: { channel: '#general', text: '', webhookUrl: '' },
  },
  {
    type: 'TRANSFORM',
    label: 'Transform',
    description: 'Map and reshape data',
    icon: '⇄',
    color: '#06b6d4',
    accentColor: 'rgba(6, 182, 212, 0.15)',
    category: 'transform',
    defaultConfig: { mapping: '{}', description: '' },
  },
  {
    type: 'FILTER',
    label: 'Filter',
    description: 'Filter data by conditions',
    icon: '⊟',
    color: '#ef4444',
    accentColor: 'rgba(239, 68, 68, 0.15)',
    category: 'transform',
    defaultConfig: { conditions: '[]', description: '' },
  },
];

// Fast lookup map
export const NODE_REGISTRY = new Map<FlowNodeType, NodePaletteItem>(
  NODE_PALETTE.map((n) => [n.type, n]),
);

export const getNodeDef = (type: FlowNodeType | string): NodePaletteItem => {
  const def = NODE_REGISTRY.get(type as FlowNodeType);
  if (!def) {
    // Fallback for unknown types
    return {
      type: type as FlowNodeType,
      label: type,
      description: '',
      icon: '◆',
      color: '#64748b',
      accentColor: 'rgba(100, 116, 139, 0.15)',
      category: 'action',
      defaultConfig: {},
    };
  }
  return def;
};

// Categories for grouped display
export const NODE_CATEGORIES = [
  { key: 'trigger', label: 'Triggers', color: '#f97316' },
  { key: 'logic', label: 'Logic', color: '#a855f7' },
  { key: 'action', label: 'Actions', color: '#3b82f6' },
  { key: 'transform', label: 'Transform', color: '#06b6d4' },
] as const;
