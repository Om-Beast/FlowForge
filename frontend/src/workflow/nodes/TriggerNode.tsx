import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface TriggerNodeData {
  label: string;
  event?: string;
}

const TriggerNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TriggerNodeData;
  return (
    <div className="rounded-lg border-2 border-green-500 bg-surface px-4 py-2 shadow-lg">
      <div className="text-xs font-semibold text-green-400">TRIGGER</div>
      <div className="text-sm text-text-main">{nodeData.label}</div>
      <Handle type="source" position={Position.Bottom} className="!bg-green-500" />
    </div>
  );
});
TriggerNode.displayName = 'TriggerNode';
export default TriggerNode;
