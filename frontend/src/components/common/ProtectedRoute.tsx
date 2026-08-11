import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

interface Props { children?: React.ReactNode; }

export default function ProtectedRoute({ children }: Props) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  return children ? <>{children}</> : <Outlet />;
}
