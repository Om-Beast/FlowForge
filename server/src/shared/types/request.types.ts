import { Request } from 'express';
import { UserRole } from '../enums';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  requestId: string;
  correlationId: string;
  startTime: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface WorkflowFilterQuery extends PaginationQuery {
  status?: string;
  search?: string;
}

export interface ExecutionFilterQuery extends PaginationQuery {
  workflowId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}
