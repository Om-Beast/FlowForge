import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Panel,
  SelectionMode,
  type Connection,
  type IsValidConnection,
  type NodeChange,
  type EdgeChange,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { NODE_TYPES } from './nodes';
import { useBuilderHistory } from './useBuilderHistory';
import { useAutoLayout } from './useAutoLayout';
import { getNodeDef } from './nodeRegistry';
import type { FlowNode, FlowEdge, FlowNodeType, AnyNodeData } from './types';

// ─── Public interface exposed via ref ─────────────────────────────────────────

export interface WorkflowCanvasHandle {
  getNodes: () => FlowNode[];
  getEdges: () => FlowEdge[];
  undo: () => void;
  redo: () => void;
  autoLayout: () => void;
  updateNodeConfig: (nodeId: string, config: Record<string, unknown>, label?: string) => void;
  updateNodeExecutionState: (
    nodeId: string,
    state: Partial<Pick<AnyNodeData, 'isRunning' | 'isCompleted' | 'isFailed'>>,
  ) => void;
  resetExecutionState: () => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface WorkflowCanvasProps {
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onSelectionChange: (node: FlowNode | null) => void;
  onHistoryChange: (canUndo: boolean, canRedo: boolean) => void;
  onDirtyChange: (isDirty: boolean) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNewNode(type: FlowNodeType, position: { x: number; y: number }): FlowNode {
  const def = getNodeDef(type);
  return {
    id: `node-${type.toLowerCase()}-${Date.now()}`,
    type,
    position,
    data: {
      label: def.label,
      nodeType: type,
      config: { ...def.defaultConfig },
      isRunning: false,
      isCompleted: false,
      isFailed: false,
      hasError: false,
      isSelected: false,
    } as AnyNodeData,
  };
}

// ─── Inner canvas (must be inside ReactFlowProvider) ─────────────────────────

const WorkflowCanvasInner = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(
  ({ initialNodes, initialEdges, onSelectionChange, onHistoryChange, onDirtyChange }, ref) => {
    const { screenToFlowPosition, fitView } = useReactFlow();
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState<FlowNode>(initialNodes);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<FlowEdge>(initialEdges);
    const didMountRef = useRef(false);
    const { snapshot, undo, redo, canUndo, canRedo } = useBuilderHistory();
    const { applyLayout } = useAutoLayout();

    // Emit history state after each snapshot
    const notifyHistory = useCallback(
      (u: boolean, r: boolean) => onHistoryChange(u, r),
      [onHistoryChange],
    );

    const markDirty = useCallback(() => onDirtyChange(true), [onDirtyChange]);

    // ── Node / Edge change handlers ──────────────────────────────────────────

    const onNodesChange = useCallback(
      (changes: NodeChange<FlowNode>[]) => {
        onNodesChangeInternal(changes);
        const hasEffect = changes.some(
          (c) => c.type === 'remove' || (c.type === 'position' && !c.dragging),
        );
        if (hasEffect) markDirty();
      },
      [onNodesChangeInternal, markDirty],
    );

    const onEdgesChange = useCallback(
      (changes: EdgeChange<FlowEdge>[]) => {
        onEdgesChangeInternal(changes);
        const hasEffect = changes.some((c) => c.type === 'remove');
        if (hasEffect) markDirty();
      },
      [onEdgesChangeInternal, markDirty],
    );

    // ── Connection handling ──────────────────────────────────────────────────

    const isValidConnection: IsValidConnection = useCallback(
      (connection: Connection | Edge) => {
        const { source, target } = connection;
        const sourceHandle = 'sourceHandle' in connection ? connection.sourceHandle : undefined;
        if (source === target) return false;
        const duplicate = edges.some(
          (e) => e.source === source && e.target === target && e.sourceHandle === sourceHandle,
        );
        return !duplicate;
      },
      [edges],
    );

    const onConnect = useCallback(
      (connection: Connection) => {
        const isTrueBranch = connection.sourceHandle === 'true_branch';
        const isFalseBranch = connection.sourceHandle === 'false_branch';
        const strokeColor =
          isTrueBranch ? '#10b981' : isFalseBranch ? '#ef4444' : 'rgba(99,102,241,0.8)';

        const newEdge: FlowEdge = {
          ...connection,
          id: `edge-${Date.now()}`,
          animated: true,
          data: {
            condition:
              isTrueBranch ? 'true_branch' : isFalseBranch ? 'false_branch' : undefined,
          },
          style: { strokeWidth: 2, stroke: strokeColor },
        };

        setEdges((prev) => {
          const next = addEdge(newEdge, prev);
          snapshot(nodes, next);
          notifyHistory(canUndo, canRedo);
          return next;
        });
        markDirty();
      },
      [setEdges, nodes, snapshot, canUndo, canRedo, notifyHistory, markDirty],
    );

    // ── Node selection ───────────────────────────────────────────────────────

    const onNodeClick = useCallback(
      (_: React.MouseEvent, node: Node) => {
        onSelectionChange(node as unknown as FlowNode);
      },
      [onSelectionChange],
    );

    const onPaneClick = useCallback(() => {
      onSelectionChange(null);
    }, [onSelectionChange]);

    // ── Drag & Drop from palette ─────────────────────────────────────────────

    const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
      (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const type = e.dataTransfer.getData(
          'application/reactflow-node-type',
        ) as FlowNodeType;
        if (!type) return;

        const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        const newNode = makeNewNode(type, position);

        setNodes((prev) => {
          const next = [...prev, newNode];
          snapshot(next, edges);
          notifyHistory(true, false);
          return next;
        });
        markDirty();
      },
      [screenToFlowPosition, setNodes, edges, snapshot, notifyHistory, markDirty],
    );

    // ── fitView on first render ──────────────────────────────────────────────

    React.useEffect(() => {
      if (!didMountRef.current && nodes.length > 0) {
        didMountRef.current = true;
        setTimeout(() => fitView({ padding: 0.25, duration: 400 }), 120);
      }
    }, [nodes.length, fitView]);

    // ── Imperative handle ────────────────────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({
        getNodes: () => nodes,
        getEdges: () => edges,

        undo: () => {
          const state = undo(nodes, edges);
          if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            onSelectionChange(null);
            notifyHistory(canUndo, canRedo);
          }
        },

        redo: () => {
          const state = redo(nodes, edges);
          if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            notifyHistory(canUndo, canRedo);
          }
        },

        autoLayout: () => {
          snapshot(nodes, edges);
          const laid = applyLayout(nodes, edges);
          setNodes(laid);
          setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 50);
          markDirty();
          notifyHistory(true, false);
        },

        updateNodeConfig: (nodeId, config, label) => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      config,
                      ...(label !== undefined ? { label } : {}),
                    },
                  }
                : n,
            ),
          );
          markDirty();
        },

        updateNodeExecutionState: (nodeId, state) => {
          setNodes((prev) =>
            prev.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, ...state } } : n,
            ),
          );
        },

        resetExecutionState: () => {
          setNodes((prev) =>
            prev.map((n) => ({
              ...n,
              data: {
                ...n.data,
                isRunning: false,
                isCompleted: false,
                isFailed: false,
              },
            })),
          );
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [nodes, edges, canUndo, canRedo],
    );

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <ReactFlow
        nodes={nodes as unknown as Node[]}
        edges={edges}
        onNodesChange={onNodesChange as unknown as (changes: NodeChange<Node>[]) => void}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={NODE_TYPES}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        selectionMode={SelectionMode.Partial}
        deleteKeyCode="Delete"
        multiSelectionKeyCode="Shift"
        minZoom={0.15}
        maxZoom={2.5}
        style={{ background: 'var(--color-surface-1)' }}
        defaultEdgeOptions={{
          animated: true,
          style: { strokeWidth: 2, stroke: 'rgba(99,102,241,0.8)' },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(99,102,241,0.18)"
        />
        <Controls
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        />
        <MiniMap
          nodeColor={(node) => getNodeDef(node.type as FlowNodeType).color}
          nodeStrokeWidth={2}
          maskColor="rgba(10,10,20,0.75)"
          style={{
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }}
        />

        {/* Empty state overlay */}
        {nodes.length === 0 && (
          <Panel position="top-center" style={{ pointerEvents: 'none', userSelect: 'none' }}>
            <div
              style={{
                marginTop: '12vh',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
              }}
            >
              <div style={{ fontSize: '4rem', opacity: 0.12, marginBottom: '1.25rem' }}>⧫</div>
              <p
                style={{
                  fontSize: '1.0625rem',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: '0.5rem',
                }}
              >
                Start building your workflow
              </p>
              <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                Drag nodes from the palette on the left onto the canvas
              </p>
            </div>
          </Panel>
        )}
      </ReactFlow>
    );
  },
);
WorkflowCanvasInner.displayName = 'WorkflowCanvasInner';

// ─── Outer wrapper — provides ReactFlowProvider ───────────────────────────────

const WorkflowCanvas = forwardRef<WorkflowCanvasHandle, WorkflowCanvasProps>(
  (props, ref) => (
    <ReactFlowProvider>
      <WorkflowCanvasInner ref={ref} {...props} />
    </ReactFlowProvider>
  ),
);
WorkflowCanvas.displayName = 'WorkflowCanvas';

export default WorkflowCanvas;
