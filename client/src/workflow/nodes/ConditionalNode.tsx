import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

interface ConditionalNodeData {
  label: string;
  expression?: string;
}

const ConditionalNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as ConditionalNodeData;
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-surface px-4 py-2 shadow-lg">
      <div className="text-xs font-semibold text-blue-400">CONDITION</div>
      <div className="text-sm text-text-main">{nodeData.label}</div>
      <Handle type="target" position={Position.Top} className="!bg-blue-500" />
      <Handle type="source" position={Position.Bottom} id="true" className="!bg-green-500 !left-1/4" />
      <Handle type="source" position={Position.Bottom} id="false" className="!bg-red-500 !left-3/4" />
    </div>
  );
});
ConditionalNode.displayName = 'ConditionalNode';
export default ConditionalNode;
