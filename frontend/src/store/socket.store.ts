import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from './auth.store';

interface SocketState {
  socket: Socket | null;
  connected: boolean;
  connect: () => void;
  disconnect: () => void;
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
}

export const useSocketStore = create<SocketState>()((set, get) => ({
  socket: null,
  connected: false,

  connect: () => {
    const token = useAuthStore.getState().accessToken;
    if (!token || get().socket?.connected) return;

    const socket = io(import.meta.env['VITE_WS_URL'] ?? 'http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on('connect_error', () => set({ connected: false }));

    set({ socket });
  },

  disconnect: () => {
    get().socket?.disconnect();
    set({ socket: null, connected: false });
  },

  joinRoom: (room: string) => get().socket?.emit(`join:${room.split(':')[0]}`, room.split(':')[1]),
  leaveRoom: (room: string) => get().socket?.emit(`leave:${room.split(':')[0]}`, room.split(':')[1]),
}));
