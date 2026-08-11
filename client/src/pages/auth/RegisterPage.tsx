import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register(form);
  };

  const errorMsg = registerError
    ? ((registerError as {response?: {data?: {error?: {message?: string}}}})?.response?.data?.error?.message ?? 'Registration failed')
    : null;

  return (
    <div className="glass animate-scale-in" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: '0.25rem' }}>Create account</h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Start automating your workflows</p>

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
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Full Name</label>
            <input type="text" className="input-base" placeholder="John Smith" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Email</label>
            <input type="email" className="input-base" placeholder="you@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.375rem' }}>Password</label>
            <input type="password" className="input-base" placeholder="Min 8 chars, uppercase, number, symbol" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={isRegistering} style={{ width: '100%', marginTop: '0.5rem' }}>
            {isRegistering ? <><div className="spinner spinner-sm" /> Creating...</> : 'Create Account'}
          </button>
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
        Already have an account?{' '}
        <Link to="/auth/login" style={{ color: 'var(--color-brand-400)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
      </div>
    </div>
  );
}
