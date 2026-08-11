import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface NotificationNodeData {
  label: string;
  channel?: 'email' | 'slack' | 'webhook';
}

const NotificationNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as NotificationNodeData;
  return (
    <div className="rounded-lg border-2 border-purple-500 bg-surface px-4 py-2 shadow-lg">
      <div className="text-xs font-semibold text-purple-400">NOTIFICATION</div>
      <div className="text-sm text-text-main">{nodeData.label}</div>
      <Handle type="target" position={Position.Top} className="!bg-purple-500" />
      <Handle type="source" position={Position.Bottom} className="!bg-purple-500" />
    </div>
  );
});
NotificationNode.displayName = 'NotificationNode';
export default NotificationNode;
