import { create } from 'zustand';

interface WorkflowState {
  workflows: any[];
  setWorkflows: (workflows: any[]) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  workflows: [],
  setWorkflows: (workflows) => set({ workflows }),
}));
