import { Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';

export default function RootLayout() {
  const { isAuthenticated } = useAuthStore();
  const { connect } = useSocketStore();

  useEffect(() => {
    if (isAuthenticated) connect();
  }, [isAuthenticated]);

  return <Outlet />;
}
