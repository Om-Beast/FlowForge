import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/sidebar/Sidebar';
import Header from '../components/common/Header';

export default function DashboardLayout() {
  const { pathname } = useLocation();
  // Builder page needs overflow: hidden so React Flow canvas fills exactly
  const isBuilder = pathname.includes('/edit');

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header />
        <main
          style={{
            flex: 1,
            overflow: isBuilder ? 'hidden' : 'auto',
            background: 'var(--color-surface-1)',
            minHeight: 0,
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
