type Variant = 'success' | 'error' | 'warning' | 'info' | 'purple' | 'neutral';

interface Props {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const STATUS_MAP: Record<string, Variant> = {
  COMPLETED: 'success',
  ACTIVE: 'success',
  FAILED: 'error',
  INACTIVE: 'error',
  RUNNING: 'info',
  PENDING: 'warning',
  DRAFT: 'neutral',
  CANCELLED: 'neutral',
  TIMED_OUT: 'error',
};

export function statusVariant(status: string): Variant {
  return STATUS_MAP[status] ?? 'neutral';
}

export default function Badge({ variant = 'neutral', children, className = '' }: Props) {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>;
}
