import type { FC } from 'react';

interface WorkerMetricsProps {
  totalWorkers?: number;
  activeWorkers?: number;
  idleWorkers?: number;
}

const WorkerMetrics: FC<WorkerMetricsProps> = ({ totalWorkers = 0, activeWorkers = 0, idleWorkers = 0 }) => {
  // TODO: Implement worker metrics display
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-lg font-semibold text-text-main">Worker Health</h3>
      <div className="space-y-2 text-sm">
        <p className="text-text-secondary">Total: <span className="text-text-main">{totalWorkers}</span></p>
        <p className="text-text-secondary">Active: <span className="text-green-400">{activeWorkers}</span></p>
        <p className="text-text-secondary">Idle: <span className="text-yellow-400">{idleWorkers}</span></p>
      </div>
    </div>
  );
};

export default WorkerMetrics;
