import { useCallback } from 'react';
import type { FlowNode, FlowEdge } from './types';

// ─── Pure JS Dagre-style auto-layout (no external dependency) ─────────────────
// Uses a topological sort + layered Sugiyama-like algorithm.
// This avoids adding the dagre package which can have ESM issues.

const NODE_WIDTH = 200;
const NODE_HEIGHT = 80;
const H_GAP = 80;
const V_GAP = 120;



function computeLayout(
  nodes: FlowNode[],
  edges: FlowEdge[],
): Map<string, { x: number; y: number }> {
  if (nodes.length === 0) return new Map();

  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const adjacency = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      adjacency.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  // Kahn's algorithm – topological sort to assign layers
  const layers = new Map<string, number>();
  const queue: string[] = [];

  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const currentLayer = layers.get(id) ?? 0;
    for (const neighbor of adjacency.get(id) ?? []) {
      const neighborLayer = Math.max(layers.get(neighbor) ?? 0, currentLayer + 1);
      layers.set(neighbor, neighborLayer);
      const newDeg = (inDegree.get(neighbor) ?? 0) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  // Handle disconnected nodes — give them layer 0
  for (const node of nodes) {
    if (!layers.has(node.id)) layers.set(node.id, 0);
  }

  // Group nodes by layer
  const byLayer = new Map<number, string[]>();
  for (const [id, layer] of layers) {
    if (!byLayer.has(layer)) byLayer.set(layer, []);
    byLayer.get(layer)!.push(id);
  }

  // Build position map
  const positions = new Map<string, { x: number; y: number }>();
  const maxLayer = Math.max(...layers.values(), 0);

  for (let layer = 0; layer <= maxLayer; layer++) {
    const nodesInLayer = byLayer.get(layer) ?? [];
    const totalWidth = nodesInLayer.length * (NODE_WIDTH + H_GAP) - H_GAP;
    const startX = -totalWidth / 2;

    nodesInLayer.forEach((id, i) => {
      positions.set(id, {
        x: startX + i * (NODE_WIDTH + H_GAP),
        y: layer * (NODE_HEIGHT + V_GAP),
      });
    });
  }

  return positions;
}

export function useAutoLayout() {
  const applyLayout = useCallback(
    (
      nodes: FlowNode[],
      edges: FlowEdge[],
    ): FlowNode[] => {
      const positions = computeLayout(nodes, edges);
      return nodes.map((node) => {
        const pos = positions.get(node.id);
        if (!pos) return node;
        return { ...node, position: pos };
      });
    },
    [],
  );

  return { applyLayout };
}

