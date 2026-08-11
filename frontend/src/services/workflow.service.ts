import api from './api.service';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  definition: WorkflowDefinition;
  status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  triggerType: string;
  version: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { executions: number };
}

export interface CreateWorkflowPayload {
  name: string;
  description?: string;
  definition: WorkflowDefinition;
  triggerType?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean };
}

export const workflowService = {
  list: (params?: Record<string, unknown>) =>
    api.get<{ data: Workflow[]; meta: PaginatedResponse<Workflow>['meta'] }>('/workflows', { params }).then((r) => ({
      data: r.data.data,
      meta: (r.data as unknown as PaginatedResponse<Workflow>).meta,
    })),

  getById: (id: string) =>
    api.get<{ data: Workflow }>(`/workflows/${id}`).then((r) => r.data.data),

  create: (payload: CreateWorkflowPayload) =>
    api.post<{ data: Workflow }>('/workflows', payload).then((r) => r.data.data),

  update: (id: string, payload: Partial<CreateWorkflowPayload> & { status?: string }) =>
    api.patch<{ data: Workflow }>(`/workflows/${id}`, payload).then((r) => r.data.data),

  delete: (id: string) => api.delete(`/workflows/${id}`),

  activate: (id: string) =>
    api.post<{ data: Workflow }>(`/workflows/${id}/activate`).then((r) => r.data.data),

  deactivate: (id: string) =>
    api.post<{ data: Workflow }>(`/workflows/${id}/deactivate`).then((r) => r.data.data),

  execute: (id: string, input?: Record<string, unknown>) =>
    api.post(`/workflows/${id}/execute`, { input }).then((r) => r.data.data),

  validate: (definition: WorkflowDefinition) =>
    api.post('/workflows/validate', { definition }).then((r) => r.data.data),
};
