import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(form);
  };

  const errorMsg = loginError
    ? ((loginError as {response?: {data?: {error?: {message?: string}}}})?.response?.data?.error?.message ?? 'Login failed')
    : null;

  return (
    <div className="glass animate-scale-in" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Welcome back</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Sign in to your account</p>

      {errorMsg && (
        <div style={{
          padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444', fontSize: '0.875rem', marginBottom: '1rem',
        }}>{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Email</label>
            <input
              type="email"
              className="input-base"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-base"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                autoComplete="current-password"
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.75rem',
                }}
              >{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={isLoggingIn} style={{ width: '100%', marginTop: '0.5rem' }}>
            {isLoggingIn ? (
              <><div className="spinner spinner-sm" /> Signing in...</>
            ) : 'Sign In'}
          </button>
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Don't have an account?{' '}
        <Link to="/auth/register" style={{ color: 'var(--color-brand-400)', fontWeight: 500, textDecoration: 'none' }}>Create one</Link>
      </div>

      {/* Demo credentials */}
      <div style={{
        marginTop: '1.5rem', padding: '0.75rem 1rem',
        background: 'var(--color-surface-3)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        fontSize: '0.75rem', color: 'var(--color-text-muted)',
      }}>
        <strong style={{ color: 'var(--color-text-secondary)' }}>Demo:</strong>{' '}
        demo@flowforge.io / Demo@123456
      </div>
    </div>
  );
}
