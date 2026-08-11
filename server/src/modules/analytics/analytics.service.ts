import { prisma } from '../../database';
import { ExecutionStatus } from '../../shared/enums';

export interface AnalyticsSummary {
  totalWorkflows: number;
  totalExecutions: number;
  successRate: number;
  failureRate: number;
  avgDurationMs: number;
  executionsLast24h: number;
  executionsLast7d: number;
}

export interface TimeSeriesPoint {
  date: string;
  total: number;
  successful: number;
  failed: number;
  avgDurationMs: number;
}

export interface NodeTypeStats {
  nodeType: string;
  count: number;
  successRate: number;
}

export class AnalyticsService {
  async getSummary(userId: string): Promise<AnalyticsSummary> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalWorkflows, execStats, recent24h, recent7d] = await Promise.all([
      prisma.workflow.count({ where: { userId } }),
      prisma.workflowExecution.aggregate({
        where: { userId },
        _count: { id: true },
        _avg: { durationMs: true },
      }),
      prisma.workflowExecution.count({
        where: { userId, createdAt: { gte: last24h } },
      }),
      prisma.workflowExecution.count({
        where: { userId, createdAt: { gte: last7d } },
      }),
    ]);

    const [successCount, failureCount] = await Promise.all([
      prisma.workflowExecution.count({
        where: { userId, status: ExecutionStatus.COMPLETED },
      }),
      prisma.workflowExecution.count({
        where: { userId, status: ExecutionStatus.FAILED },
      }),
    ]);

    const total = execStats._count.id;
    const successRate = total > 0 ? (successCount / total) * 100 : 0;
    const failureRate = total > 0 ? (failureCount / total) * 100 : 0;

    return {
      totalWorkflows,
      totalExecutions: total,
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      avgDurationMs: Math.round(execStats._avg.durationMs ?? 0),
      executionsLast24h: recent24h,
      executionsLast7d: recent7d,
    };
  }

  async getTimeSeries(
    userId: string,
    days = 30,
  ): Promise<TimeSeriesPoint[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const executions = await prisma.workflowExecution.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        status: true,
        durationMs: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate = new Map<string, { total: number; successful: number; failed: number; totalDuration: number }>();

    for (const exec of executions) {
      const date = exec.createdAt.toISOString().split('T')[0]!;
      const existing = byDate.get(date) ?? { total: 0, successful: 0, failed: 0, totalDuration: 0 };
      existing.total++;
      if (exec.status === ExecutionStatus.COMPLETED) existing.successful++;
      if (exec.status === ExecutionStatus.FAILED) existing.failed++;
      existing.totalDuration += exec.durationMs ?? 0;
      byDate.set(date, existing);
    }

    // Fill in missing days with zeros
    const result: TimeSeriesPoint[] = [];
    for (let i = 0; i <= days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0]!;
      const data = byDate.get(dateStr);
      result.push({
        date: dateStr,
        total: data?.total ?? 0,
        successful: data?.successful ?? 0,
        failed: data?.failed ?? 0,
        avgDurationMs: data && data.total > 0 ? Math.round(data.totalDuration / data.total) : 0,
      });
    }

    return result;
  }

  async getWorkflowStats(userId: string, workflowId: string) {
    const [total, byStatus, recentExecutions] = await Promise.all([
      prisma.workflowExecution.count({ where: { userId, workflowId } }),
      prisma.workflowExecution.groupBy({
        by: ['status'],
        where: { userId, workflowId },
        _count: { id: true },
        _avg: { durationMs: true },
      }),
      prisma.workflowExecution.findMany({
        where: { userId, workflowId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          status: true,
          durationMs: true,
          createdAt: true,
          triggeredBy: true,
        },
      }),
    ]);

    return { total, byStatus, recentExecutions };
  }
}
