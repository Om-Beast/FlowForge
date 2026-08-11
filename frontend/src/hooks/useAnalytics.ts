import { useQuery } from '@tanstack/react-query';
import { analyticsService } from '../services/analytics.service';
import { executionService } from '../services/execution.service';

export const useAnalyticsSummary = () =>
  useQuery({ queryKey: ['analytics', 'summary'], queryFn: () => analyticsService.getSummary(), staleTime: 60_000 });

export const useTimeSeries = (days = 30) =>
  useQuery({ queryKey: ['analytics', 'timeseries', days], queryFn: () => analyticsService.getTimeSeries(days), staleTime: 60_000 });

export const useDashboard = () =>
  useQuery({ queryKey: ['dashboard'], queryFn: () => executionService.getDashboard(), staleTime: 30_000 });

export const useQueueStats = () =>
  useQuery({ queryKey: ['queue', 'stats'], queryFn: () => executionService.getQueueStats(), refetchInterval: 5000 });

export const useExecutionLogs = (params?: Record<string, unknown>) =>
  useQuery({ queryKey: ['logs', 'executions', params], queryFn: () => executionService.getLogs(params) });
