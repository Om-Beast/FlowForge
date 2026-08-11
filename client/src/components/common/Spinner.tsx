interface Props {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: Props) {
  return <div className={`spinner spinner-${size} ${className}`} role="status" aria-label="Loading" />;
}
