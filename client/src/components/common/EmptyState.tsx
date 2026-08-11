import { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
      {icon && (
        <div style={{ marginBottom: '1rem', opacity: 0.4, fontSize: '3rem', lineHeight: 1 }}>{icon}</div>
      )}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '0.5rem' }}>{title}</h3>
      {description && (
        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', maxWidth: 360, margin: '0 auto 1.5rem' }}>{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
