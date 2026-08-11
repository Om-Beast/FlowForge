import { useCallback, useRef, useState } from 'react';
import type { FlowNode, FlowEdge, HistorySnapshot } from './types';

const MAX_HISTORY = 50;

export interface UseBuilderHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  snapshot: (nodes: FlowNode[], edges: FlowEdge[]) => void;
  undo: (currentNodes: FlowNode[], currentEdges: FlowEdge[]) => HistorySnapshot | null;
  redo: (currentNodes: FlowNode[], currentEdges: FlowEdge[]) => HistorySnapshot | null;
  clearHistory: () => void;
}

/**
 * Undo/Redo history for the workflow builder.
 * Uses a pointer-based stack for O(1) undo/redo.
 * Caller is responsible for applying the returned snapshot to React Flow.
 */
export function useBuilderHistory(): UseBuilderHistoryReturn {
  const historyRef = useRef<HistorySnapshot[]>([]);
  const pointerRef = useRef<number>(-1);
  const [, forceRender] = useState(0);

  const rerender = () => forceRender((n) => n + 1);

  const snapshot = useCallback((nodes: FlowNode[], edges: FlowEdge[]) => {
    // Trim any redo history after current pointer
    historyRef.current = historyRef.current.slice(0, pointerRef.current + 1);

    // Deep clone to prevent mutation
    historyRef.current.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    });

    // Cap history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      pointerRef.current++;
    }

    rerender();
  }, []);

  const undo = useCallback(
    (currentNodes: FlowNode[], currentEdges: FlowEdge[]): HistorySnapshot | null => {
      if (pointerRef.current <= 0) return null;

      // If at end of stack and no "current" saved, save current state
      if (pointerRef.current === historyRef.current.length - 1) {
        // Save current before undoing
        historyRef.current.push({
          nodes: JSON.parse(JSON.stringify(currentNodes)),
          edges: JSON.parse(JSON.stringify(currentEdges)),
        });
      }

      pointerRef.current = Math.max(0, pointerRef.current - 1);
      rerender();
      return historyRef.current[pointerRef.current] ?? null;
    },
    [],
  );

  const redo = useCallback(
    (_currentNodes: FlowNode[], _currentEdges: FlowEdge[]): HistorySnapshot | null => {
      if (pointerRef.current >= historyRef.current.length - 1) return null;
      pointerRef.current = Math.min(historyRef.current.length - 1, pointerRef.current + 1);
      rerender();
      return historyRef.current[pointerRef.current] ?? null;
    },
    [],
  );

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    pointerRef.current = -1;
    rerender();
  }, []);

  return {
    canUndo: pointerRef.current > 0,
    canRedo: pointerRef.current < historyRef.current.length - 1,
    snapshot,
    undo,
    redo,
    clearHistory,
  };
}
