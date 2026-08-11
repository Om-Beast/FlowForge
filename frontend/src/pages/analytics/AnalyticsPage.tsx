import { useState } from 'react';
import { useAnalyticsSummary, useTimeSeries } from '../../hooks/useAnalytics';
import Spinner from '../../components/common/Spinner';
import StatCard from '../../components/common/StatCard';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data: summary, isLoading: loadingSummary } = useAnalyticsSummary();
  const { data: timeSeries, isLoading: loadingTS } = useTimeSeries(days);

  const customTooltipStyle = {
    backgroundColor: 'var(--color-surface-3)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: '0.8125rem',
  };

  return (
    <div className="page-wrapper">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Execution performance and workflow insights</p>
        </div>
        <select
          className="input-base"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          style={{ maxWidth: 160 }}
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loadingSummary ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}><Spinner /></div>
      ) : (
        <div className="stat-grid" style={{ marginBottom: '2rem' }}>
          <StatCard label="Total Workflows" value={summary?.totalWorkflows ?? 0} icon="⧫" color="#818cf8" />
          <StatCard label="Total Executions" value={summary?.totalExecutions ?? 0} icon="▷" color="#3b82f6" />
          <StatCard label="Success Rate" value={`${summary?.successRate ?? 0}%`} icon="✓" color="#10b981" />
          <StatCard label="Failure Rate" value={`${summary?.failureRate ?? 0}%`} icon="✗" color="#ef4444" />
          <StatCard label="Avg Duration" value={`${((summary?.avgDurationMs ?? 0) / 1000).toFixed(1)}s`} icon="⏱" color="#f59e0b" />
          <StatCard label="Last 24h" value={summary?.executionsLast24h ?? 0} icon="↻" color="#c084fc" subtitle="executions" />
        </div>
      )}

      {/* Execution timeline */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title">Execution Timeline</h2>
        {loadingTS ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeries ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradFailed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Area type="monotone" dataKey="successful" stroke="#10b981" fill="url(#gradSuccess)" strokeWidth={2} name="Successful" />
              <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#gradFailed)" strokeWidth={2} name="Failed" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Execution counts bar chart */}
      <div className="card">
        <h2 className="section-title">Daily Execution Volume</h2>
        {loadingTS ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner /></div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={timeSeries ?? []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: 'var(--color-text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={customTooltipStyle} />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '0.8125rem' }} />
              <Bar dataKey="successful" stackId="a" fill="#10b981" name="Successful" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" stackId="a" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
