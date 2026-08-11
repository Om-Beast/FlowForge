import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowService, CreateWorkflowPayload } from '../services/workflow.service';

export const WORKFLOW_KEYS = {
  all: ['workflows'] as const,
  list: (params?: Record<string, unknown>) => [...WORKFLOW_KEYS.all, 'list', params] as const,
  detail: (id: string) => [...WORKFLOW_KEYS.all, 'detail', id] as const,
};

export const useWorkflows = (params?: Record<string, unknown>) =>
  useQuery({
    queryKey: WORKFLOW_KEYS.list(params),
    queryFn: () => workflowService.list(params),
  });

export const useWorkflow = (id: string) =>
  useQuery({
    queryKey: WORKFLOW_KEYS.detail(id),
    queryFn: () => workflowService.getById(id),
    enabled: !!id,
  });

export const useCreateWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWorkflowPayload) => workflowService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all }),
  });
};

export const useUpdateWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<CreateWorkflowPayload> & { status?: string } }) =>
      workflowService.update(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.detail(vars.id) });
      qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all });
    },
  });
};

export const useDeleteWorkflow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workflowService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: WORKFLOW_KEYS.all }),
  });
};

export const useExecuteWorkflow = () =>
  useMutation({
    mutationFn: ({ id, input }: { id: string; input?: Record<string, unknown> }) =>
      workflowService.execute(id, input),
  });
