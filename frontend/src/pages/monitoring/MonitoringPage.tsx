import { useEffect, useState } from 'react';
import { useQueueStats } from '../../hooks/useAnalytics';
import { useSocket } from '../../hooks/useSocket';
import StatCard from '../../components/common/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MetricsPoint {
  time: string;
  waiting: number;
  active: number;
  failed: number;
  completed: number;
}

export default function MonitoringPage() {
  const { data: queueStats } = useQueueStats();
  const { on, emit } = useSocket();
  const [metrics, setMetrics] = useState<MetricsPoint[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    emit('subscribe:queue_metrics');

    const off = on('queue:metrics', (data: unknown) => {
      const m = data as Record<string, number | string>;
      const point: MetricsPoint = {
        time: new Date().toLocaleTimeString(),
        waiting: m['waiting'] as number ?? 0,
        active: m['active'] as number ?? 0,
        failed: m['failed'] as number ?? 0,
        completed: m['completed'] as number ?? 0,
      };
      setLiveMetrics(m as Record<string, number>);
      setMetrics((prev) => [...prev.slice(-59), point]);
    });

    return () => {
      (off as (() => void))();
      emit('unsubscribe:queue_metrics');
    };
  }, [on, emit]);

  const stats = liveMetrics['waiting'] !== undefined ? liveMetrics : queueStats ?? {};

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Queue Monitoring</h1>
        <p className="page-subtitle">Real-time BullMQ queue metrics and worker health</p>
      </div>

      <div className="stat-grid" style={{ marginBottom: '2rem' }}>
        <StatCard label="Waiting" value={stats['waiting'] ?? 0} icon="⏳" color="#f59e0b" />
        <StatCard label="Active" value={stats['active'] ?? 0} icon="⚡" color="#3b82f6" />
        <StatCard label="Completed" value={stats['completed'] ?? 0} icon="✓" color="#10b981" />
        <StatCard label="Failed" value={stats['failed'] ?? 0} icon="✗" color="#ef4444" />
        <StatCard label="Delayed" value={stats['delayed'] ?? 0} icon="⏰" color="#c084fc" />
      </div>

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 className="section-title" style={{ margin: 0 }}>Live Queue Metrics</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse-blue 2s infinite' }} />
            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>Live — last 60s</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={metrics} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradActive" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="gradWaiting" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="time" tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval={9} />
            <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--color-surface-3)', border: '1px solid var(--color-border)', borderRadius: 8, color: 'var(--color-text-primary)', fontSize: 12 }} />
            <Area type="monotone" dataKey="active" stroke="#3b82f6" fill="url(#gradActive)" strokeWidth={2} name="Active" />
            <Area type="monotone" dataKey="waiting" stroke="#f59e0b" fill="url(#gradWaiting)" strokeWidth={2} name="Waiting" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

