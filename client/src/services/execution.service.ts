import api from './api.service';

export const executionService = {
  getLogs: (params?: Record<string, unknown>) =>
    api.get('/logs/executions', { params }).then((r) => ({ data: r.data.data, meta: (r.data as Record<string, unknown>)['meta'] })),

  getById: (id: string) => api.get(`/logs/executions/${id}`).then((r) => r.data.data),

  getDashboard: () => api.get('/dashboard').then((r) => r.data.data),

  getQueueStats: () => api.get('/queues/stats').then((r) => r.data.data),

  getNotifications: (params?: Record<string, unknown>) =>
    api.get('/notifications', { params }).then((r) => r.data.data),

  markNotificationRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllNotificationsRead: () => api.post('/notifications/mark-all-read'),
  getUnreadCount: () => api.get('/notifications/unread-count').then((r) => r.data.data),
};
