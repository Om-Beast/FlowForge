import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWorkflow, useUpdateWorkflow, useExecuteWorkflow } from '@hooks/useWorkflows';
import { workflowService } from '@services/workflow.service';
import { useSocket } from '@hooks/useSocket';
import WorkflowCanvas, { type WorkflowCanvasHandle } from '@workflow/WorkflowCanvas';
import NodePalette from '@workflow/NodePalette';
import NodeConfigPanel from '@workflow/NodeConfigPanel';
import WorkflowToolbar from '@workflow/WorkflowToolbar';
import Spinner from '@components/common/Spinner';
import type { FlowNode, FlowEdge, FlowNodeType, AnyNodeData } from '@workflow/types';
import type { WorkflowDefinition, WorkflowNode, WorkflowEdge } from '@services/workflow.service';

// ─── Conversion helpers ───────────────────────────────────────────────────────

function apiNodesToFlow(nodes: WorkflowNode[]): FlowNode[] {
  return nodes.map((n) => ({
    id: n.id,
    type: n.type as FlowNodeType,
    position: n.position,
    data: {
      label: n.label,
      nodeType: n.type as FlowNodeType,
      config: n.config,
      isRunning: false,
      isCompleted: false,
      isFailed: false,
      hasError: false,
      isSelected: false,
    } as AnyNodeData,
  }));
}

function apiEdgesToFlow(edges: WorkflowEdge[]): FlowEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.condition === 'true_branch' ? 'true_branch' : e.condition === 'false_branch' ? 'false_branch' : undefined,
    animated: true,
    data: { condition: e.condition },
    style: {
      strokeWidth: 2,
      stroke: e.condition === 'true_branch' ? '#10b981' : e.condition === 'false_branch' ? '#ef4444' : 'rgba(99,102,241,0.8)',
    },
  }));
}

function flowToDefinition(nodes: FlowNode[], edges: FlowEdge[]): WorkflowDefinition {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.data.nodeType,
      label: n.data.label,
      config: n.data.config,
      position: n.position,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      condition: e.data?.condition,
    })),
  };
}

// ─── Execution event types (from Socket.IO) ──────────────────────────────────

interface ExecStepPayload {
  nodeId: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
}

interface ExecDonePayload {
  workflowId: string;
  status: 'COMPLETED' | 'FAILED';
}

// ─── Toast helper (inline — avoids circular deps with notification store) ────

function useBuilderToast() {
  const [toasts, setToasts] = useState<Array<{ id: string; msg: string; type: 'success' | 'error' | 'info' }>>([]);

  const push = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);

  return { toasts, push };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkflowBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: workflow, isLoading, isError } = useWorkflow(id ?? '');
  const updateMutation = useUpdateWorkflow();
  const executeMutation = useExecuteWorkflow();
  const { on, emit, joinRoom, leaveRoom } = useSocket();
  const canvasRef = useRef<WorkflowCanvasHandle>(null);
  const { toasts, push: pushToast } = useBuilderToast();

  // ── UI state ────────────────────────────────────────────────────────────────
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [workflowName, setWorkflowName] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'unsaved'>('saved');
  const [executionStatus, setExecutionStatus] = useState<'idle' | 'running' | 'completed' | 'failed'>('idle');
  const [isValidating, setIsValidating] = useState(false);
  const currentExecutionIdRef = useRef<string | null>(null);

  // Sync name from loaded workflow
  useEffect(() => {
    if (workflow?.name) setWorkflowName(workflow.name);
  }, [workflow?.name]);

  // ── Socket.IO execution tracking ─────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    // We'll join the execution room dynamically when execution starts
    const offStep = on('execution:step', (payload: unknown) => {
      const p = payload as ExecStepPayload;
      if (!canvasRef.current) return;
      if (p.status === 'RUNNING') {
        canvasRef.current.updateNodeExecutionState(p.nodeId, { isRunning: true, isCompleted: false, isFailed: false });
      } else if (p.status === 'COMPLETED') {
        canvasRef.current.updateNodeExecutionState(p.nodeId, { isRunning: false, isCompleted: true, isFailed: false });
      } else if (p.status === 'FAILED') {
        canvasRef.current.updateNodeExecutionState(p.nodeId, { isRunning: false, isCompleted: false, isFailed: true });
      }
    });

    const offCompleted = on('execution:completed', (payload: unknown) => {
      const p = payload as ExecDonePayload;
      if (p.workflowId !== id) return;
      setExecutionStatus('completed');
      pushToast('Workflow completed successfully', 'success');
      if (currentExecutionIdRef.current) {
        leaveRoom(`execution:${currentExecutionIdRef.current}`);
        currentExecutionIdRef.current = null;
      }
    });

    const offFailed = on('execution:failed', (payload: unknown) => {
      const p = payload as ExecDonePayload;
      if (p.workflowId !== id) return;
      setExecutionStatus('failed');
      pushToast('Workflow execution failed', 'error');
      if (currentExecutionIdRef.current) {
        leaveRoom(`execution:${currentExecutionIdRef.current}`);
        currentExecutionIdRef.current = null;
      }
    });

    return () => {
      (offStep as () => void)();
      (offCompleted as () => void)();
      (offFailed as () => void)();
    };
  }, [id, on, emit, joinRoom, leaveRoom, pushToast]);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key === 's') { e.preventDefault(); handleSave(); }
      if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); canvasRef.current?.undo(); }
      if (meta && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); canvasRef.current?.redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!id || !canvasRef.current) return;
    setSaveStatus('saving');
    try {
      const nodes = canvasRef.current.getNodes();
      const edges = canvasRef.current.getEdges();
      const definition = flowToDefinition(nodes, edges);
      await updateMutation.mutateAsync({ id, payload: { name: workflowName, definition } });
      setSaveStatus('saved');
      setIsDirty(false);
      pushToast('Workflow saved', 'success');
    } catch {
      setSaveStatus('error');
      pushToast('Failed to save workflow', 'error');
    }
  }, [id, workflowName, updateMutation, pushToast]);

  const handleValidate = useCallback(async () => {
    if (!canvasRef.current) return;
    setIsValidating(true);
    try {
      const nodes = canvasRef.current.getNodes();
      const edges = canvasRef.current.getEdges();
      const definition = flowToDefinition(nodes, edges);
      await workflowService.validate(definition);
      pushToast('Workflow is valid ✓', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Validation failed';
      pushToast(msg, 'error');
    } finally {
      setIsValidating(false);
    }
  }, [pushToast]);

  const handleExecute = useCallback(async () => {
    if (!id || !canvasRef.current) return;
    setExecutionStatus('running');
    canvasRef.current.resetExecutionState();
    try {
      const result = await executeMutation.mutateAsync({ id });
      const execId = (result as { executionId?: string })?.executionId;
      if (execId) {
        currentExecutionIdRef.current = execId;
        joinRoom(`execution:${execId}`);
      }
      pushToast('Execution started', 'info');
    } catch {
      setExecutionStatus('failed');
      pushToast('Failed to start execution', 'error');
    }
  }, [id, executeMutation, joinRoom, pushToast]);

  const handleNameChange = useCallback((name: string) => {
    setWorkflowName(name);
    setIsDirty(true);
    setSaveStatus('unsaved');
  }, []);

  const handleUpdateNodeConfig = useCallback(
    (nodeId: string, config: Record<string, unknown>, label?: string) => {
      canvasRef.current?.updateNodeConfig(nodeId, config, label);
    },
    [],
  );

  const handleHistoryChange = useCallback((u: boolean, r: boolean) => {
    setCanUndo(u);
    setCanRedo(r);
  }, []);

  const handleDirtyChange = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
    if (dirty) setSaveStatus('unsaved');
  }, []);

  const handleSelectionChange = useCallback((node: FlowNode | null) => {
    setSelectedNode(node);
  }, []);

  // ── Loading / error ──────────────────────────────────────────────────────

  if (!id) {
    navigate('/workflows');
    return null;
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem', color: 'var(--color-text-secondary)' }}>
        <Spinner size="lg" />
        <span>Loading workflow…</span>
      </div>
    );
  }

  if (isError || !workflow) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '1rem' }}>
        <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚠</div>
        <p style={{ color: 'var(--color-text-secondary)' }}>Workflow not found or failed to load.</p>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/workflows')}>← Back to Workflows</button>
      </div>
    );
  }

  const initialNodes = apiNodesToFlow(workflow.definition.nodes);
  const initialEdges = apiEdgesToFlow(workflow.definition.edges);

  return (
    <div className="builder-page">
      {/* ── Toolbar ── */}
      <WorkflowToolbar
        workflowName={workflowName}
        onNameChange={handleNameChange}
        onSave={handleSave}
        onValidate={handleValidate}
        onExecute={handleExecute}
        onUndo={() => canvasRef.current?.undo()}
        onRedo={() => canvasRef.current?.redo()}
        onAutoLayout={() => canvasRef.current?.autoLayout()}
        canUndo={canUndo}
        canRedo={canRedo}
        isDirty={isDirty}
        isSaving={updateMutation.isPending}
        isExecuting={executeMutation.isPending || executionStatus === 'running'}
        isValidating={isValidating}
        executionStatus={executionStatus}
        saveStatus={saveStatus}
        workflowStatus={workflow.status}
      />

      {/* ── Builder body ── */}
      <div className="builder-body">
        {/* Node Palette */}
        <NodePalette disabled={executionStatus === 'running'} />

        {/* Canvas */}
        <div className="builder-canvas">
          <WorkflowCanvas
            ref={canvasRef}
            initialNodes={initialNodes}
            initialEdges={initialEdges}
            onSelectionChange={handleSelectionChange}
            onHistoryChange={handleHistoryChange}
            onDirtyChange={handleDirtyChange}
          />
        </div>

        {/* Config Panel */}
        <NodeConfigPanel
          selectedNode={selectedNode}
          onUpdateConfig={handleUpdateNodeConfig}
          onClose={() => setSelectedNode(null)}
        />
      </div>

      {/* ── Toast Notifications ── */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              background: t.type === 'success' ? 'rgba(16,185,129,0.15)' : t.type === 'error' ? 'rgba(239,68,68,0.15)' : 'var(--color-surface-3)',
              border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.3)' : t.type === 'error' ? 'rgba(239,68,68,0.3)' : 'var(--color-border)'}`,
              color: t.type === 'success' ? '#10b981' : t.type === 'error' ? '#ef4444' : 'var(--color-text-primary)',
              fontSize: '0.875rem',
              fontWeight: 500,
              boxShadow: 'var(--shadow-elevated)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              minWidth: 240,
              maxWidth: 400,
              animation: 'fade-in 0.2s ease forwards',
            }}
          >
            {t.type === 'success' && '✓ '}
            {t.type === 'error' && '✗ '}
            {t.type === 'info' && 'ℹ '}
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
