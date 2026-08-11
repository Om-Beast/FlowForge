import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authService, LoginPayload, RegisterPayload } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { useSocketStore } from '../store/socket.store';

export const useAuth = () => {
  const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
  const { connect, disconnect } = useSocketStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (data) => {
      setAuth(
        { id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role as 'ADMIN' | 'USER', createdAt: data.user.createdAt },
        data.accessToken,
        data.refreshToken,
      );
      connect();
      navigate('/');
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: (data) => {
      setAuth(
        { id: data.user.id, email: data.user.email, name: data.user.name, role: data.user.role as 'ADMIN' | 'USER', createdAt: data.user.createdAt },
        data.accessToken,
        data.refreshToken,
      );
      connect();
      navigate('/');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      disconnect();
      clearAuth();
      qc.clear();
      navigate('/auth/login');
    },
  });

  return {
    user,
    isAuthenticated,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
};

