import { prisma } from '../../database';
import { queueService } from '../queue/queue.service';
import { ExecutionStatus, WorkflowStatus } from '../../shared/enums';

export interface DashboardSummary {
  stats: {
    totalWorkflows: number;
    activeWorkflows: number;
    totalExecutions: number;
    runningExecutions: number;
    successRate: number;
  };
  recentExecutions: Array<{
    id: string;
    workflowName: string;
    status: string;
    durationMs: number | null;
    createdAt: Date;
    triggeredBy: string;
  }>;
  queueHealth: {
    waiting: number;
    active: number;
    failed: number;
    redisConnected: boolean;
  };
}

export class DashboardService {
  async getSummary(userId: string): Promise<DashboardSummary> {
    const [
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      runningExecutions,
      successCount,
      recentExecutions,
    ] = await Promise.all([
      prisma.workflow.count({ where: { userId } }),
      prisma.workflow.count({ where: { userId, status: WorkflowStatus.ACTIVE } }),
      prisma.workflowExecution.count({ where: { userId } }),
      prisma.workflowExecution.count({ where: { userId, status: ExecutionStatus.RUNNING } }),
      prisma.workflowExecution.count({ where: { userId, status: ExecutionStatus.COMPLETED } }),
      prisma.workflowExecution.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { workflow: { select: { name: true } } },
      }),
    ]);

    const successRate = totalExecutions > 0 ? (successCount / totalExecutions) * 100 : 0;

    let redisConnected = false;
let waiting = 0;
let active = 0;
let failed = 0;

try {
  const queueStats = await queueService.getStats();

  waiting = queueStats.waiting;
  active = queueStats.active;
  failed = queueStats.failed;

  redisConnected = true;
} catch {
  redisConnected = false;
}

    return {
      stats: {
        totalWorkflows,
        activeWorkflows,
        totalExecutions,
        runningExecutions,
        successRate: Math.round(successRate * 100) / 100,
      },
      recentExecutions: recentExecutions.map((e) => ({
        id: e.id,
        workflowName: e.workflow.name,
        status: e.status,
        durationMs: e.durationMs,
        createdAt: e.createdAt,
        triggeredBy: e.triggeredBy,
      })),
      queueHealth: { waiting, active, failed, redisConnected },
    };
  }
}
