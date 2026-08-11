import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboard, useQueueStats } from '../../hooks/useAnalytics';
import { useSocket } from '../../hooks/useSocket';
import StatCard from '../../components/common/StatCard';
import Badge, { statusVariant } from '../../components/common/Badge';
import Spinner from '../../components/common/Spinner';
import { formatDistanceToNow } from 'date-fns';

export default function DashboardPage() {
  const { data: dashboard, isLoading, refetch } = useDashboard();
  const { data: queueStats } = useQueueStats();
  const { on } = useSocket();

  useEffect(() => {
    // Refresh dashboard when executions complete
    const off = on('execution:completed', () => { refetch(); });
    return off as (() => void);
  }, [on]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Spinner size="lg" />
      </div>
    );
  }

  const stats = dashboard?.stats ?? {};

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Real-time overview of your workflow automation platform</p>
        </div>
        <Link to="/workflows" className="btn btn-primary" style={{ textDecoration: 'none' }}>+ New Workflow</Link>
      </div>

      {/* Stat grid */}
      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="Total Workflows" value={stats.totalWorkflows ?? 0} icon="⧫" color="#818cf8" />
        <StatCard label="Active Workflows" value={stats.activeWorkflows ?? 0} icon="◉" color="#10b981" />
        <StatCard label="Total Executions" value={stats.totalExecutions ?? 0} icon="▷" color="#3b82f6" />
        <StatCard label="Success Rate" value={`${stats.successRate ?? 0}%`} icon="✓" color="#10b981" />
        <StatCard label="Running Now" value={stats.runningExecutions ?? 0} icon="⚡" color="#f59e0b" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem', alignItems: 'start' }}>
        {/* Recent executions */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h2 className="section-title" style={{ margin: 0 }}>Recent Executions</h2>
            <Link to="/logs" style={{ fontSize: '0.8125rem', color: 'var(--color-brand-400)', textDecoration: 'none' }}>View all</Link>
          </div>

          {!dashboard?.recentExecutions?.length ? (
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', textAlign: 'center', padding: '2rem' }}>No executions yet. Create and run a workflow to get started.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Workflow</th>
                    <th>Status</th>
                    <th>Duration</th>
                    <th>Triggered</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.recentExecutions.map((exec: Record<string, unknown>) => (
                    <tr key={exec['id'] as string}>
                      <td style={{ fontWeight: 500 }}>{exec['workflowName'] as string}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className={`status-dot ${String(exec['status']).toLowerCase()}`} />
                          <Badge variant={statusVariant(exec['status'] as string)}>{exec['status'] as string}</Badge>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-text-secondary)', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8125rem' }}>
                        {exec['durationMs'] ? `${((exec['durationMs'] as number) / 1000).toFixed(2)}s` : '—'}
                      </td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>{exec['triggeredBy'] as string}</td>
                      <td style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>
                        {formatDistanceToNow(new Date(exec['createdAt'] as string), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Queue health */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h2 className="section-title">Queue Health</h2>
            {[{label: 'Waiting', value: queueStats?.waiting ?? dashboard?.queueHealth?.waiting ?? 0, color: '#f59e0b'},
              {label: 'Active', value: queueStats?.active ?? dashboard?.queueHealth?.active ?? 0, color: '#3b82f6'},
              {label: 'Failed', value: queueStats?.failed ?? dashboard?.queueHealth?.failed ?? 0, color: '#ef4444'},
              {label: 'Completed', value: queueStats?.completed ?? 0, color: '#10b981'},
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>{item.label}</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'JetBrains Mono, monospace' }}>{item.value}</span>
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: dashboard?.queueHealth?.redisConnected ? 'var(--color-success)' : 'var(--color-error)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Redis {dashboard?.queueHealth?.redisConnected ? 'connected' : 'disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
