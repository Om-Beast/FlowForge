import type { FC } from 'react';

interface QueueMetricsProps {
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
}

const QueueMetrics: FC<QueueMetricsProps> = ({ waiting = 0, active = 0, completed = 0, failed = 0 }) => {
  // TODO: Implement queue metrics cards
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Waiting</p><p className="text-2xl font-bold text-text-main">{waiting}</p></div>
      <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Active</p><p className="text-2xl font-bold text-blue-400">{active}</p></div>
      <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Completed</p><p className="text-2xl font-bold text-green-400">{completed}</p></div>
      <div className="rounded-lg bg-surface p-4"><p className="text-text-secondary">Failed</p><p className="text-2xl font-bold text-red-400">{failed}</p></div>
    </div>
  );
};

export default QueueMetrics;
