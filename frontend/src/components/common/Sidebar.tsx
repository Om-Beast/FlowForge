import { NavLink } from 'react-router-dom';
import { cn } from '@components/ui/Button';

export function Sidebar() {
  const links = [
    { name: 'Dashboard', path: '/' },
    { name: 'Workflows', path: '/workflows' },
    { name: 'Monitoring', path: '/monitoring' },
    { name: 'Analytics', path: '/analytics' },
    { name: 'Logs', path: '/logs' },
  ];

  return (
    <aside className="w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] h-full flex flex-col">
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                isActive
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-border)]/50 hover:text-[var(--color-text-main)]"
              )
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

