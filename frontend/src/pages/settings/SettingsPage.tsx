import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/auth.store';
import api from '../../services/api.service';

type SettingsTab = 'profile' | 'security' | 'preferences' | 'api-keys' | 'theme' | 'system';

interface Tab {
  id: SettingsTab;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { id: 'profile', label: 'Profile', icon: '👤' },
  { id: 'security', label: 'Security', icon: '🔒' },
  { id: 'preferences', label: 'Preferences', icon: '⚙️' },
  { id: 'api-keys', label: 'API Keys', icon: '🔑' },
  { id: 'theme', label: 'Theme', icon: '🎨' },
  { id: 'system', label: 'System', icon: '💻' },
];

function ProfileSettings() {
  const { user } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch('/auth/profile', { name, email });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore in demo
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Profile Information</h2>
        <p className="settings-section-desc">Update your personal details and public profile.</p>
      </div>

      <div className="settings-form">
        <div className="form-row">
          <div className="avatar-display">
            <div className="avatar-circle">
              {(user?.name ?? 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>{user?.name}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{user?.role} account</p>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your full name"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="form-group">
          <label className="form-label">User ID</label>
          <input
            className="form-input"
            value={user?.id ?? ''}
            readOnly
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
            This is your immutable user identifier.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function SecuritySettings() {
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleChange = async () => {
    setError('');
    if (newPwd !== confirmPwd) { setError('Passwords do not match.'); return; }
    if (newPwd.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: currentPwd, newPassword: newPwd });
      setSaved(true);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg ?? 'Failed to change password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Security</h2>
        <p className="settings-section-desc">Manage your password and authentication settings.</p>
      </div>

      <div className="settings-form">
        <div style={{
          padding: '0.875rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-start',
        }}>
          <span>🔐</span>
          <div>
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>
              Password-based authentication
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
              Your account uses email and password login. Keep your password strong and unique.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Current Password</label>
          <input
            className="form-input"
            type="password"
            value={currentPwd}
            onChange={e => setCurrentPwd(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="form-group">
          <label className="form-label">New Password</label>
          <input
            className="form-input"
            type="password"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div className="form-group">
          <label className="form-label">Confirm New Password</label>
          <input
            className="form-input"
            type="password"
            value={confirmPwd}
            onChange={e => setConfirmPwd(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p style={{ color: '#ef4444', fontSize: '0.8125rem', padding: '0.5rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </p>
        )}
        {saved && (
          <p style={{ color: '#10b981', fontSize: '0.8125rem', padding: '0.5rem 0.75rem', background: 'rgba(16,185,129,0.08)', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>
            ✓ Password changed successfully.
          </p>
        )}

        <button
          className="btn btn-primary"
          onClick={handleChange}
          disabled={saving || !currentPwd || !newPwd || !confirmPwd}
          style={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Updating…' : 'Update Password'}
        </button>
      </div>
    </div>
  );
}

function PreferencesSettings() {
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSlack, setNotifSlack] = useState(false);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Preferences</h2>
        <p className="settings-section-desc">Configure your notification and display preferences.</p>
      </div>

      <div className="settings-form">
        <div>
          <label className="form-label">Notifications</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[
              { label: 'Email notifications', desc: 'Receive execution status updates via email', value: notifEmail, onChange: setNotifEmail },
              { label: 'Slack notifications', desc: 'Send workflow alerts to your Slack workspace', value: notifSlack, onChange: setNotifSlack },
            ].map(item => (
              <label key={item.label} style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${item.value ? 'rgba(99,102,241,0.3)' : 'var(--color-border)'}`,
                background: item.value ? 'rgba(99,102,241,0.05)' : 'var(--color-surface-2)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}>
                <input
                  type="checkbox"
                  checked={item.value}
                  onChange={e => item.onChange(e.target.checked)}
                  style={{ marginTop: 2, accentColor: '#6366f1' }}
                />
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--color-text-primary)' }}>{item.label}</p>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.125rem' }}>{item.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Timezone</label>
          <select
            className="form-input"
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            style={{ cursor: 'pointer' }}
          >
            {['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'].map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          style={{ alignSelf: 'flex-start' }}
        >
          {saved ? '✓ Saved' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}

function ApiKeysSettings() {
  const [copied, setCopied] = useState(false);
  const { user } = useAuthStore();

  const demoKey = `ff_live_${user?.id?.slice(0, 8) ?? 'xxxxxxxx'}${Date.now().toString(36)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(demoKey).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">API Keys</h2>
        <p className="settings-section-desc">Use API keys to authenticate programmatic access to FlowForge.</p>
      </div>

      <div className="settings-form">
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>Default API Key</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Created automatically · Full access</p>
            </div>
            <span style={{ fontSize: '0.6875rem', padding: '0.25rem 0.5rem', borderRadius: 100, background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', fontWeight: 600 }}>
              Active
            </span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.75rem' }}>
            <code style={{
              flex: 1,
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-surface-1)',
              border: '1px solid var(--color-border)',
              fontSize: '0.8125rem',
              fontFamily: 'ui-monospace, monospace',
              color: 'var(--color-text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {demoKey.slice(0, 12)}{'•'.repeat(24)}
            </code>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleCopy}
              style={{ flexShrink: 0 }}
            >
              {copied ? '✓ Copied' : '📋 Copy'}
            </button>
          </div>
        </div>

        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
        }}>
          <p style={{ fontSize: '0.8125rem', color: '#d97706', fontWeight: 500 }}>
            ⚠️ Keep your API keys secret. Never expose them in client-side code or public repositories.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>Usage example</p>
          <pre style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-surface-1)',
            border: '1px solid var(--color-border)',
            fontSize: '0.75rem',
            fontFamily: 'ui-monospace, monospace',
            color: 'var(--color-text-secondary)',
            overflow: 'auto',
            margin: 0,
          }}>
{`curl -X POST https://api.flowforge.dev/api/workflows \\
  -H "Authorization: Bearer ${demoKey.slice(0, 12)}..." \\
  -H "Content-Type: application/json" \\
  -d '{"name": "My Workflow"}'`}
          </pre>
        </div>
      </div>
    </div>
  );
}

function ThemeSettings() {
  const [accent, setAccent] = useState('#6366f1');

  const PRESETS = [
    { color: '#6366f1', label: 'Indigo (Default)' },
    { color: '#8b5cf6', label: 'Violet' },
    { color: '#ec4899', label: 'Pink' },
    { color: '#06b6d4', label: 'Cyan' },
    { color: '#10b981', label: 'Emerald' },
    { color: '#f59e0b', label: 'Amber' },
  ];

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">Appearance</h2>
        <p className="settings-section-desc">Customize the visual theme of your FlowForge workspace.</p>
      </div>

      <div className="settings-form">
        <div>
          <label className="form-label">Color Mode</label>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            {[
              { id: 'dark', label: '🌙 Dark', desc: 'Easy on the eyes' },
              { id: 'light', label: '☀️ Light', desc: 'Coming soon' },
            ].map(mode => (
              <button
                key={mode.id}
                disabled={mode.id === 'light'}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${mode.id === 'dark' ? 'rgba(99,102,241,0.5)' : 'var(--color-border)'}`,
                  background: mode.id === 'dark' ? 'rgba(99,102,241,0.08)' : 'var(--color-surface-2)',
                  cursor: mode.id === 'light' ? 'not-allowed' : 'pointer',
                  opacity: mode.id === 'light' ? 0.5 : 1,
                  textAlign: 'left',
                }}
              >
                <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.125rem' }}>{mode.label}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="form-label">Accent Color</label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
            {PRESETS.map(preset => (
              <button
                key={preset.color}
                title={preset.label}
                onClick={() => setAccent(preset.color)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: preset.color,
                  border: `3px solid ${accent === preset.color ? 'white' : 'transparent'}`,
                  cursor: 'pointer',
                  boxShadow: accent === preset.color ? `0 0 0 2px ${preset.color}` : 'none',
                  transition: 'all 150ms ease',
                }}
              />
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            Selected: {PRESETS.find(p => p.color === accent)?.label}
          </p>
        </div>

        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(99,102,241,0.06)',
          border: '1px solid rgba(99,102,241,0.2)',
        }}>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            Theme preferences are saved locally. Custom theming with full CSS variable overrides is available in the Enterprise plan.
          </p>
        </div>
      </div>
    </div>
  );
}

function SystemSettings() {
  const { clearAuth } = useAuthStore();
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'error'>('checking');
  
  useState(() => {
    api.get('/health').then(() => setApiStatus('online')).catch(() => setApiStatus('error'));
  });

  const handleLogout = () => {
    clearAuth();
    window.location.href = '/auth/login';
  };

  return (
    <div className="settings-section">
      <div className="settings-section-header">
        <h2 className="settings-section-title">System & Advanced</h2>
        <p className="settings-section-desc">System information and danger zone.</p>
      </div>

      <div className="settings-form">
        <div style={{ padding: '1rem', background: 'var(--color-surface-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>System Information</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
            <span>Frontend Version: 1.0.0</span>
            <span>OS: window</span>
          </div>
        </div>
        
        <div style={{ padding: '1rem', background: 'var(--color-surface-3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>API Connectivity</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
            Status: 
            {apiStatus === 'checking' ? <span style={{ color: 'var(--color-warning)' }}>Checking...</span> : 
             apiStatus === 'online' ? <span style={{ color: 'var(--color-success)' }}>Online</span> : 
             <span style={{ color: 'var(--color-error)' }}>Error</span>}
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-error)', marginBottom: '0.5rem' }}>Danger Zone</h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>Log out of your account on this device.</p>
          <button className="btn btn-danger" onClick={handleLogout}>Log Out</button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const CONTENT: Record<SettingsTab, React.ReactNode> = {
    profile: <ProfileSettings />,
    security: <SecuritySettings />,
    preferences: <PreferencesSettings />,
    'api-keys': <ApiKeysSettings />,
    theme: <ThemeSettings />,
    system: <SystemSettings />,
  };

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account, security, and workspace preferences.</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        gap: '1.5rem',
        alignItems: 'start',
      }}>
        {/* Sidebar nav */}
        <nav style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          position: 'sticky',
          top: '1rem',
        }}>
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              id={`settings-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '0.625rem',
                padding: '0.75rem 1rem',
                background: activeTab === tab.id ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${activeTab === tab.id ? '#6366f1' : 'transparent'}`,
                borderBottom: i < TABS.length - 1 ? '1px solid var(--color-border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                color: activeTab === tab.id ? '#818cf8' : 'var(--color-text-secondary)',
                fontSize: '0.875rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                transition: 'all 150ms ease',
              }}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content area */}
        <div style={{
          background: 'var(--color-surface-2)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {CONTENT[activeTab]}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .settings-section {
          padding: 2rem;
        }
        .settings-section-header {
          margin-bottom: 1.75rem;
          padding-bottom: 1.25rem;
          border-bottom: 1px solid var(--color-border);
        }
        .settings-section-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--color-text-primary);
          margin: 0 0 0.375rem;
        }
        .settings-section-desc {
          font-size: 0.875rem;
          color: var(--color-text-muted);
          margin: 0;
        }
        .settings-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text-secondary);
        }
        .form-input {
          background: var(--color-surface-3);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 0.625rem 0.875rem;
          font-size: 0.875rem;
          color: var(--color-text-primary);
          outline: none;
          transition: border-color 150ms ease;
          width: 100%;
          box-sizing: border-box;
          font-family: inherit;
        }
        .form-input:focus {
          border-color: rgba(99,102,241,0.6);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .form-input option {
          background: var(--color-surface-3);
        }
        .avatar-display {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          background: var(--color-surface-3);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-border);
        }
        .avatar-circle {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #4f46e5, #818cf8);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.125rem;
          font-weight: 700;
          color: #fff;
          flex-shrink: 0;
        }
        .form-row {
          margin-bottom: 0.25rem;
        }
      `}</style>
    </div>
  );
}
