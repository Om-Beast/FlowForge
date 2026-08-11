import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { useSocketStore } from '../../store/socket.store';
import { useQueryClient } from '@tanstack/react-query';
import { authService } from '../../services/auth.service';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '⊞', exact: true },
  { to: '/workflows', label: 'Workflows', icon: '⧫' },
  { to: '/monitoring', label: 'Monitoring', icon: '◉' },
  { to: '/analytics', label: 'Analytics', icon: '▦' },
  { to: '/logs', label: 'Logs', icon: '≡' },
];

export default function Sidebar() {
  const { user, clearAuth } = useAuthStore();
  const { disconnect } = useSocketStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* best effort */ }
    disconnect();
    clearAuth();
    qc.clear();
    navigate('/auth/login');
  };

  return (
    <aside style={{
      width: 240,
      minHeight: '100vh',
      background: 'var(--color-surface-2)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      padding: '0',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1rem', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
          }}>F</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-primary)' }}>FlowForge</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Automation Platform</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.625rem 0.875rem',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: isActive ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
              background: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.2)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
            })}
          >
            <span style={{ fontSize: '1rem', opacity: 0.9 }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid var(--color-border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          padding: '0.75rem', borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-3)',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.875rem', fontWeight: 700, color: '#fff', flexShrink: 0,
          }}>{user?.name?.[0]?.toUpperCase() ?? 'U'}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn btn-ghost btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', gap: '0.5rem', color: 'var(--color-text-muted)' }}
        >
          <span>⇦</span> Sign Out
        </button>
      </div>
    </aside>
  );
}
