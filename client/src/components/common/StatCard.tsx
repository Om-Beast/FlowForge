import { ReactNode } from 'react';

interface Props {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  color?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, trend, color = '#818cf8', subtitle }: Props) {
  return (
    <div className="stat-card animate-fade-in" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0, width: 80, height: 80,
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        borderRadius: '0 var(--radius-lg) 0 0',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        {icon && (
          <div style={{ color, opacity: 0.8, fontSize: '1.25rem' }}>{icon}</div>
        )}
      </div>

      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-text-primary)', letterSpacing: '-0.025em', lineHeight: 1 }}>
        {value}
      </div>

      {subtitle && (
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.375rem' }}>{subtitle}</p>
      )}

      {trend && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: trend.value >= 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 600 }}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}
