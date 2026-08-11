import type { FC } from 'react';

interface SystemHealthProps {
  dbConnected?: boolean;
  redisConnected?: boolean;
  uptimeSeconds?: number;
}

const SystemHealth: FC<SystemHealthProps> = ({ dbConnected = false, redisConnected = false, uptimeSeconds = 0 }) => {
  // TODO: Implement system health indicators
  return (
    <div className="rounded-lg bg-surface p-4">
      <h3 className="mb-2 text-lg font-semibold text-text-main">System Health</h3>
      <div className="space-y-2 text-sm">
        <p><span className={dbConnected ? 'text-green-400' : 'text-red-400'}>●</span> PostgreSQL</p>
        <p><span className={redisConnected ? 'text-green-400' : 'text-red-400'}>●</span> Redis</p>
        <p className="text-text-secondary">Uptime: {Math.floor(uptimeSeconds / 3600)}h {Math.floor((uptimeSeconds % 3600) / 60)}m</p>
      </div>
    </div>
  );
};

export default SystemHealth;
