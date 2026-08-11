import React from 'react';
import { cn } from './Button';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
        {
          "border-transparent bg-[var(--color-primary)]/10 text-[var(--color-primary)]": variant === 'default',
          "border-transparent bg-[var(--color-success)]/10 text-[var(--color-success)]": variant === 'success',
          "border-transparent bg-[var(--color-warning)]/10 text-[var(--color-warning)]": variant === 'warning',
          "border-transparent bg-[var(--color-danger)]/10 text-[var(--color-danger)]": variant === 'danger',
          "text-[var(--color-text-main)] border-[var(--color-border)]": variant === 'outline',
        },
        className
      )}
      {...props}
    />
  );
}
