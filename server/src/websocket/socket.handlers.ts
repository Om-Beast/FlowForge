import { Server, Socket } from 'socket.io';

const isValidId = (value: unknown): value is string => {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 100
  );
};

export const registerHandlers = (socket: Socket): void => {
  socket.on('join:workflow', (workflowId: unknown) => {
    if (!isValidId(workflowId)) {
      socket.emit('error', {
        message: 'Invalid workflow ID',
      });
      return;
    }

    socket.join(`workflow:${workflowId}`);
  });

  socket.on('leave:workflow', (workflowId: unknown) => {
    if (!isValidId(workflowId)) return;

    socket.leave(`workflow:${workflowId}`);
  });

  socket.on('join:execution', (executionId: unknown) => {
    if (!isValidId(executionId)) {
      socket.emit('error', {
        message: 'Invalid execution ID',
      });
      return;
    }

    socket.join(`execution:${executionId}`);
  });

  socket.on('leave:execution', (executionId: unknown) => {
    if (!isValidId(executionId)) return;

    socket.leave(`execution:${executionId}`);
  });

  socket.on('subscribe:queue_metrics', () => {
    socket.join('queue:metrics');
  });

  socket.on('unsubscribe:queue_metrics', () => {
    socket.leave('queue:metrics');
  });
};