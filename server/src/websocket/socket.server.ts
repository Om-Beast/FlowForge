import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { appConfig, socketConfig } from '../config';
import { verifyAccessToken } from '../utils';
import { logger } from '../utils';
import { eventBus } from '../events';

export interface SocketUser {
  id: string;
  email: string;
  role: string;
  name: string;
}

declare module 'socket.io' {
  interface Socket {
    user: SocketUser;
  }
}

let io: SocketIOServer | null = null;

export const initializeSocketServer = (httpServer: HttpServer): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: appConfig.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: socketConfig.pingTimeout,
    pingInterval: socketConfig.pingInterval,
    maxHttpBufferSize: socketConfig.maxBufferSize,
    transports: ['websocket', 'polling'],
  });

  // ── Authentication middleware ─────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const payload = verifyAccessToken(token);
      socket.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        name: payload.name,
      };

      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const { id: userId, name } = socket.user;
    logger.info('Socket connected', { socketId: socket.id, userId, name });

    // Join user-specific room for targeted events
    socket.join(`user:${userId}`);

    // ── Room management ────────────────────────────────────────────────────
    socket.on('join:workflow', (workflowId: string) => {
      if (typeof workflowId !== 'string' || !workflowId.trim()) return;
      socket.join(`workflow:${workflowId}`);
      logger.debug('Socket joined workflow room', { socketId: socket.id, workflowId });
    });

    socket.on('leave:workflow', (workflowId: string) => {
      socket.leave(`workflow:${workflowId}`);
    });

    socket.on('join:execution', (executionId: string) => {
      if (typeof executionId !== 'string' || !executionId.trim()) return;
      socket.join(`execution:${executionId}`);
    });

    socket.on('leave:execution', (executionId: string) => {
      socket.leave(`execution:${executionId}`);
    });

    socket.on('subscribe:queue_metrics', () => {
      socket.join('queue:metrics');
    });

    socket.on('unsubscribe:queue_metrics', () => {
      socket.leave('queue:metrics');
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, userId, reason });
    });

    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, userId, error: err.message });
    });
  });

  // ── Wire internal events to sockets ──────────────────────────────────────

  eventBus.subscribe('execution:started', (payload) => {
    io?.to(`user:${payload.userId}`).emit('execution:started', payload);
    io?.to(`workflow:${payload.workflowId}`).emit('execution:started', payload);
    io?.to(`execution:${payload.executionId}`).emit('execution:started', payload);
  });

  eventBus.subscribe('execution:step', (payload) => {
    io?.to(`execution:${payload.executionId}`).emit('execution:step', payload);
    io?.to(`user:${payload.userId}`).emit('execution:step', payload);
  });

  eventBus.subscribe('execution:completed', (payload) => {
    io?.to(`user:${payload.userId}`).emit('execution:completed', payload);
    io?.to(`workflow:${payload.workflowId}`).emit('execution:completed', payload);
    io?.to(`execution:${payload.executionId}`).emit('execution:completed', payload);
  });

  eventBus.subscribe('execution:failed', (payload) => {
    io?.to(`user:${payload.userId}`).emit('execution:failed', payload);
    io?.to(`workflow:${payload.workflowId}`).emit('execution:failed', payload);
    io?.to(`execution:${payload.executionId}`).emit('execution:failed', payload);
  });

  eventBus.subscribe('notification:send', (payload) => {
    io?.to(`user:${payload.userId}`).emit('notification', payload);
  });

  eventBus.subscribe('queue:metrics', (payload) => {
    io?.to('queue:metrics').emit('queue:metrics', payload);
  });

  logger.info('Socket.IO server initialized');
  return io;
};

export const getSocketServer = (): SocketIOServer => {
  if (!io) throw new Error('Socket.IO server not initialized');
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown): void => {
  io?.to(`user:${userId}`).emit(event, data);
};

export const emitToRoom = (room: string, event: string, data: unknown): void => {
  io?.to(room).emit(event, data);
};

export const closeSocketServer = async (): Promise<void> => {
  if (io) {
    await new Promise<void>((resolve) => io!.close(() => resolve()));
    io = null;
    logger.info('Socket.IO server closed');
  }
};
