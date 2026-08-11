import { useEffect, useCallback } from 'react';
import { useSocketStore } from '../store/socket.store';
import { useAuthStore } from '../store/auth.store';

export const useSocket = () => {
  const { socket, connected, connect, joinRoom, leaveRoom } = useSocketStore();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && !connected) {
      connect();
    }
    return () => {
      // Don't disconnect on component unmount — socket is global
    };
  }, [isAuthenticated]);

  const on = useCallback(
    (event: string, handler: (...args: unknown[]) => void) => {
      socket?.on(event, handler);
      return () => socket?.off(event, handler);
    },
    [socket],
  );

  const emit = useCallback(
    (event: string, ...args: unknown[]) => socket?.emit(event, ...args),
    [socket],
  );

  return { socket, connected, on, emit, joinRoom, leaveRoom };
};

