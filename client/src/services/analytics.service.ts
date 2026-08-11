import api from './api.service';

export const analyticsService = {
  getSummary: () => api.get('/analytics/summary').then((r) => r.data.data),
  getTimeSeries: (days?: number) => api.get('/analytics/time-series', { params: { days } }).then((r) => r.data.data),
  getWorkflowStats: (workflowId: string) => api.get(`/analytics/workflow/${workflowId}`).then((r) => r.data.data),
};
