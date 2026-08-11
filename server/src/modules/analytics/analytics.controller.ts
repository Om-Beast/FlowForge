import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { sendSuccess } from '../../utils';
import { AuthenticatedRequest } from '../../shared/types';

export class AnalyticsController {
  private readonly service = new AnalyticsService();

  async getSummary(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const data = await this.service.getSummary(userId);
    sendSuccess(res, data);
  }

  async getTimeSeries(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const days = parseInt((req.query['days'] as string) ?? '30', 10) || 30;
    const data = await this.service.getTimeSeries(userId, Math.min(days, 90));
    sendSuccess(res, data);
  }

  async getWorkflowStats(req: Request, res: Response): Promise<void> {
    const { id: userId } = (req as AuthenticatedRequest).user;
    const { workflowId } = req.params as { workflowId: string };
    const data = await this.service.getWorkflowStats(userId, workflowId);
    sendSuccess(res, data);
  }
}
