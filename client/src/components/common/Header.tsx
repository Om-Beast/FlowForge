import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@store/auth.store';
import { useSocketStore } from '@store/socket.store';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { authService } from '@services/auth.service';
import { executionService } from '@services/execution.service';

// ─── Page title resolver ──────────────────────────────────────────────────────

function usePageTitle() {
  const { pathname } = useLocation();
  if (pathname === '/') return 'Dashboard';
  if (pathname.startsWith('/workflows') && pathname.includes('/edit')) return 'Workflow Builder';
  if (pathname.startsWith('/workflows')) return 'Workflows';
  if (pathname.startsWith('/monitoring')) return 'Queue Monitoring';
  if (pathname.startsWith('/analytics')) return 'Analytics';
  if (pathname.startsWith('/logs')) return 'Execution Logs';
  if (pathname.startsWith('/settings')) return 'Settings';
  return 'FlowForge';
}

// ─── Notification item ────────────────────────────────────────────────────────

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

function NotificationItem({ n, onRead }: { n: ApiNotification; onRead: (id: string) => void }) {
  const typeColor: Record<string, string> = {
    SUCCESS: '#10b981',
    ERROR: '#ef4444',
    WARNING: '#f59e0b',
    INFO: '#3b82f6',
  };
  const color = typeColor[n.type] ?? '#64748b';

  return (
    <div
      onClick={() => { if (!n.read) onRead(n.id); }}
      style={{
        padding: '0.875rem 1rem',
        borderBottom: '1px solid var(--color-border)',
        background: n.read ? 'transparent' : 'rgba(99,102,241,0.04)',
        cursor: n.read ? 'default' : 'pointer',
        transition: 'background 150ms ease',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.8125rem', fontWeight: n.read ? 400 : 600, color: 'var(--color-text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
          {n.title}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
          {n.message}
        </p>
        <p style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
          {new Date(n.createdAt).toLocaleString()}
        </p>
      </div>
      {!n.read && (
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-brand-400)', flexShrink: 0, marginTop: 6 }} />
      )}
    </div>
  );
}

// ─── Notifications panel ──────────────────────────────────────────────────────

function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { data: notifs, refetch } = useQuery<ApiNotification[]>({
    queryKey: ['notifications'],
    queryFn: () => executionService.getNotifications({ limit: 20 }) as Promise<ApiNotification[]>,
    staleTime: 30_000,
  });

  const handleRead = async (id: string) => {
    await executionService.markNotificationRead(id);
    refetch();
  };

  const handleReadAll = async () => {
    await executionService.markAllNotificationsRead();
    refetch();
  };

  const items = notifs ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <motion.div
      className="notif-panel"
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.15 }}
    >
      {/* Header */}
      <div style={{ padding: '0.875rem 1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text-primary)' }}>Notifications</span>
          {unread > 0 && (
            <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.15rem 0.4rem', borderRadius: 100, background: 'rgba(99,102,241,0.2)', color: 'var(--color-brand-400)', border: '1px solid rgba(99,102,241,0.3)' }}>
              {unread}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {unread > 0 && (
            <button onClick={handleReadAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--color-brand-400)', padding: '0.25rem 0.375rem', borderRadius: 4 }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--color-text-muted)', padding: '0.25rem', borderRadius: 4, lineHeight: 1 }}>
            ✕
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {items.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
            No notifications yet
          </div>
        ) : (
          items.map((n) => <NotificationItem key={n.id} n={n} onRead={handleRead} />)
        )}
      </div>
    </motion.div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

export function Header() {
  const pageTitle = usePageTitle();
  const { user, clearAuth } = useAuthStore();
  const { disconnect } = useSocketStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => executionService.getUnreadCount() as Promise<{ count: number }>,
    refetchInterval: 30_000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    try { await authService.logout(); } catch { /* best-effort */ }
    disconnect();
    clearAuth();
    qc.clear();
    navigate('/auth/login');
  };

  const initials = user?.name ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() : 'U';

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        background: 'var(--color-surface-2)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: page title */}
      <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-primary)', letterSpacing: '-0.015em' }}>
        {pageTitle}
      </h2>

      {/* Right: actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>

        {/* Notifications bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowNotifs((v) => !v); setShowUserMenu(false); }}
            style={{
              position: 'relative',
              background: showNotifs ? 'var(--color-surface-3)' : 'transparent',
              border: '1px solid transparent',
              borderRadius: 8,
              cursor: 'pointer',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.125rem',
              color: showNotifs ? 'var(--color-brand-400)' : 'var(--color-text-secondary)',
              transition: 'all 150ms ease',
            }}
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#fff',
                  fontSize: '0.5625rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid var(--color-surface-2)',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifs && <NotificationsPanel onClose={() => setShowNotifs(false)} />}
          </AnimatePresence>
        </div>

        {/* User avatar + menu */}
        <div ref={userRef} style={{ position: 'relative' }}>
          <button
            onClick={() => { setShowUserMenu((v) => !v); setShowNotifs(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: showUserMenu ? 'var(--color-surface-3)' : 'transparent',
              border: '1px solid transparent',
              borderRadius: 8,
              cursor: 'pointer',
              padding: '0.25rem 0.5rem 0.25rem 0.25rem',
              transition: 'all 150ms ease',
            }}
            aria-label="User menu"
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f46e5, #818cf8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </span>
            <span style={{ fontSize: '0.625rem', color: 'var(--color-text-muted)' }}>▾</span>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.12 }}
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: 200,
                  background: 'var(--color-surface-2)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-elevated)',
                  overflow: 'hidden',
                  zIndex: 500,
                }}
              >
                {/* User info */}
                <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(99,102,241,0.04)' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name}</p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                  <span style={{ fontSize: '0.625rem', fontWeight: 700, padding: '0.1rem 0.4rem', borderRadius: 100, background: 'rgba(129,140,248,0.15)', color: '#818cf8', border: '1px solid rgba(129,140,248,0.25)', marginTop: 4, display: 'inline-block' }}>
                    {user?.role}
                  </span>
                </div>

                {/* Menu items */}
                {[
                  { label: '⚙ Settings', action: () => { navigate('/settings'); setShowUserMenu(false); } },
                  { label: '⇦ Sign Out', action: handleLogout, danger: true },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.625rem 1rem',
                      textAlign: 'left',
                      fontSize: '0.8125rem',
                      color: item.danger ? '#ef4444' : 'var(--color-text-secondary)',
                      transition: 'background 150ms ease, color 150ms ease',
                      display: 'block',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget).style.background = item.danger ? 'rgba(239,68,68,0.08)' : 'var(--color-surface-3)';
                      (e.currentTarget).style.color = item.danger ? '#ef4444' : 'var(--color-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget).style.background = 'transparent';
                      (e.currentTarget).style.color = item.danger ? '#ef4444' : 'var(--color-text-secondary)';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Header;
