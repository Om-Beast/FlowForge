import type { FC } from 'react';

interface Execution {
  id: string;
  workflowName: string;
  status: string;
  startedAt: string;
}

interface RecentExecutionsProps {
  executions?: Execution[];
}

const RecentExecutions: FC<RecentExecutionsProps> = ({ executions = [] }) => {
  // TODO: Implement recent executions list
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-lg font-semibold text-text-main">Recent Executions</h3>
      {executions.length === 0 ? (
        <p className="text-text-secondary">No recent executions</p>
      ) : (
        <ul className="space-y-2">
          {executions.map((exec) => (
            <li key={exec.id} className="text-sm text-text-secondary">{exec.workflowName} — {exec.status}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentExecutions;
