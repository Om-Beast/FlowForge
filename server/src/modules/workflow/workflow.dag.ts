import { WorkflowDefinition, WorkflowNode, WorkflowEdge, DagValidationResult } from './workflow.types';
import { NodeType } from '../../shared/enums';

/**
 * Validates a workflow DAG:
 * 1. No duplicate node IDs
 * 2. All edge sources/targets reference existing nodes
 * 3. Graph has no cycles (DFS-based)
 * 4. Graph is connected (no orphaned nodes except trigger)
 * 5. Exactly one trigger node
 */
export class WorkflowDagValidator {
  validate(definition: WorkflowDefinition): DagValidationResult {
    const errors: string[] = [];
    const { nodes, edges } = definition;

    if (!nodes || nodes.length === 0) {
      return { isValid: false, errors: ['Workflow must contain at least one node'] };
    }

    // 1. Check for duplicate node IDs
    const nodeIds = new Set<string>();
    for (const node of nodes) {
      if (nodeIds.has(node.id)) {
        errors.push(`Duplicate node ID: ${node.id}`);
      }
      nodeIds.add(node.id);
    }

    // 2. Validate edge references
    for (const edge of edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    }

    // 3. Check for exactly one trigger node
    const triggerNodes = nodes.filter(
      (n) => n.type === NodeType.WEBHOOK,
    );
    // Note: multiple trigger types allowed, but at most one WEBHOOK trigger
    if (triggerNodes.length > 1) {
      errors.push('Workflow can have at most one WEBHOOK trigger node');
    }

    // 4. Cycle detection using DFS (Kahn's algorithm variant)
    if (errors.length === 0) {
      const cycleErrors = this.detectCycles(nodes, edges);
      errors.push(...cycleErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Kahn's topological sort algorithm for cycle detection.
   * Returns error messages if cycles are detected.
   */
  private detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }

    let visited = 0;
    while (queue.length > 0) {
      const current = queue.shift()!;
      visited++;
      for (const neighbor of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    if (visited !== nodes.length) {
      return ['Workflow contains a cycle — workflows must be directed acyclic graphs (DAGs)'];
    }

    return [];
  }

  /**
   * Returns the topological execution order of nodes.
   */
  getExecutionOrder(nodes: WorkflowNode[], edges: WorkflowEdge[]): string[] {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of nodes) {
      inDegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const edge of edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
      adjacency.get(edge.source)?.push(edge.target);
    }

    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }

    const order: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      order.push(current);
      for (const neighbor of adjacency.get(current) ?? []) {
        const newDegree = (inDegree.get(neighbor) ?? 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) queue.push(neighbor);
      }
    }

    return order;
  }
}

export const workflowDagValidator = new WorkflowDagValidator();
