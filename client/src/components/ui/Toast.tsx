import { motion } from 'framer-motion';
import { cn } from './Button';

export type ToastType = 'info' | 'success' | 'error' | 'warning';

export interface ToastProps {
  id: string;
  message: string;
  type?: ToastType;
  onClose: (id: string) => void;
}

export function Toast({ id, message, type = 'info', onClose }: ToastProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto flex w-full max-w-md rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 overflow-hidden",
        {
          "bg-[var(--color-surface)] text-[var(--color-text-main)]": type === 'info',
          "bg-[var(--color-success)] text-white": type === 'success',
          "bg-[var(--color-danger)] text-white": type === 'error',
          "bg-[var(--color-warning)] text-white": type === 'warning',
        }
      )}
    >
      <div className="flex w-full items-center justify-between p-4">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => onClose(id)}
          className="ml-4 flex-shrink-0 rounded-md inline-flex text-current hover:text-white/80 focus:outline-none focus:ring-2 focus:ring-white"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}


