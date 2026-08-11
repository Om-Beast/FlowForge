import { Worker, Job } from 'bullmq';
import { Prisma } from '@prisma/client';
import { prisma } from '../../database';
import { createRedisClient, logger } from '../../utils';
import { QueueName, ExecutionStatus, StepStatus } from '../../shared/enums';
import { queueConfig } from '../../config';
import { eventBus } from '../../events';
import { WorkflowDefinition, WorkflowNode } from '../workflow/workflow.types';

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  userId: string;
  input: Record<string, unknown>;
}

export interface NodeExecutionResult {
  output: Record<string, unknown>;
  nextNodes?: string[];
  shouldSkipBranch?: string;
}

async function executeWebhookNode(_node: WorkflowNode, context: Record<string, unknown>): Promise<NodeExecutionResult> {
  return { output: { triggered: true, receivedAt: new Date().toISOString(), data: context } };
}

async function executeConditionNode(node: WorkflowNode, context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { field, operator, value } = node.config;
  const fieldPath = String(field).split('.');
  let actual: unknown = context;
  for (const key of fieldPath) actual = (actual as Record<string, unknown>)?.[key];

  let conditionMet = false;
  switch (operator) {
    case 'eq': conditionMet = actual === value; break;
    case 'ne': conditionMet = actual !== value; break;
    case 'gt': conditionMet = (actual as number) > (value as number); break;
    case 'gte': conditionMet = (actual as number) >= (value as number); break;
    case 'lt': conditionMet = (actual as number) < (value as number); break;
    case 'lte': conditionMet = (actual as number) <= (value as number); break;
    case 'contains': conditionMet = String(actual).includes(String(value)); break;
    case 'exists': conditionMet = actual !== undefined && actual !== null; break;
    default: conditionMet = false;
  }

  return {
    output: { conditionMet, field, actual, expected: value },
    shouldSkipBranch: conditionMet ? 'false_branch' : 'true_branch',
  };
}

async function executeDelayNode(node: WorkflowNode, _context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const delayMs = (node.config.delayMs as number) ?? 1000;
  await new Promise((resolve) => setTimeout(resolve, Math.min(delayMs, 30000)));
  return { output: { delayed: true, delayMs } };
}

async function executeEmailNode(node: WorkflowNode, _context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { to, subject } = node.config;
  logger.info('EMAIL node: simulated send', { to, subject });
  return { output: { sent: true, to, subject, simulatedAt: new Date().toISOString(), messageId: `sim-${Date.now()}` } };
}

async function executeHttpRequestNode(node: WorkflowNode, context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { url, method = 'POST', headers = {}, payload } = node.config;
  const response = await fetch(url as string, {
    method: method as string,
    headers: { 'Content-Type': 'application/json', ...(headers as Record<string, string>) },
    body: method !== 'GET' ? JSON.stringify(payload ?? context) : undefined,
    signal: AbortSignal.timeout(10000),
  });
  const responseBody = await response.text();
  let parsedBody: unknown;
  try { parsedBody = JSON.parse(responseBody); } catch { parsedBody = responseBody; }
  return { output: { statusCode: response.status, ok: response.ok, body: parsedBody } };
}

async function executeSlackNode(node: WorkflowNode, _context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { channel, text, webhookUrl } = node.config;
  logger.info('SLACK node: simulated message', { channel });
  if (webhookUrl) {
    try {
      await fetch(webhookUrl as string, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, channel }), signal: AbortSignal.timeout(5000) });
    } catch (err) {
      logger.warn('Slack webhook failed', { error: (err as Error).message });
    }
  }
  return { output: { sent: true, channel, text, simulatedAt: new Date().toISOString() } };
}

async function executeTransformNode(node: WorkflowNode, context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { mapping = {} } = node.config;
  const result: Record<string, unknown> = {};
  for (const [targetKey, sourcePath] of Object.entries(mapping as Record<string, string>)) {
    const keys = sourcePath.split('.');
    let value: unknown = context;
    for (const k of keys) value = (value as Record<string, unknown>)?.[k];
    result[targetKey] = value;
  }
  return { output: result };
}

async function executeFilterNode(node: WorkflowNode, context: Record<string, unknown>): Promise<NodeExecutionResult> {
  const { conditions = [] } = node.config;
  const passed = (conditions as Array<{ field: string; operator: string; value: unknown }>).every(({ field, operator, value }) => {
    const actual = context[field];
    switch (operator) {
      case 'eq': return actual === value;
      case 'ne': return actual !== value;
      case 'gt': return (actual as number) > (value as number);
      case 'lt': return (actual as number) < (value as number);
      default: return true;
    }
  });
  return { output: { passed, conditions } };
}

const NODE_EXECUTORS: Record<string, (node: WorkflowNode, ctx: Record<string, unknown>) => Promise<NodeExecutionResult>> = {
  WEBHOOK: executeWebhookNode,
  CONDITION: executeConditionNode,
  DELAY: executeDelayNode,
  EMAIL: executeEmailNode,
  HTTP_REQUEST: executeHttpRequestNode,
  SLACK: executeSlackNode,
  TRANSFORM: executeTransformNode,
  FILTER: executeFilterNode,
};

export class WorkflowWorker {
  private worker: Worker | null = null;

  start(): void {
    const connection = createRedisClient({ keyPrefix: '' });

    this.worker = new Worker<WorkflowJobData>(
      QueueName.WORKFLOW_EXECUTION,
      async (job: Job<WorkflowJobData>) => this.processJob(job),
      { connection, concurrency: queueConfig.concurrency, stalledInterval: 30000, maxStalledCount: 3 },
    );

    this.worker.on('completed', (job) => logger.info('Worker: job completed', { jobId: job.id }));
    this.worker.on('failed', (job, err) => logger.error('Worker: job failed', { jobId: job?.id, error: err.message }));
    this.worker.on('error', (err) => logger.error('Worker error', { error: err.message }));

    logger.info('Workflow worker started', { concurrency: queueConfig.concurrency });
  }

  private async processJob(job: Job<WorkflowJobData>): Promise<void> {
    const { workflowId, executionId, userId, input } = job.data;
    const startTime = Date.now();

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: { status: ExecutionStatus.RUNNING, startedAt: new Date() },
    });

    eventBus.publish('execution:started', { executionId, workflowId, userId });

    try {
      const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
      if (!workflow) throw new Error(`Workflow ${workflowId} not found`);

      const definition = workflow.definition as unknown as WorkflowDefinition;
      const { nodes, edges } = definition;

      const nodeMap = new Map<string, WorkflowNode>(nodes.map((n) => [n.id, n]));
      const adjacency = new Map<string, Array<{ target: string; condition?: string }>>();
      for (const node of nodes) adjacency.set(node.id, []);
      for (const edge of edges) adjacency.get(edge.source)?.push({ target: edge.target, condition: edge.condition });

      const hasIncoming = new Set(edges.map((e) => e.target));
      const roots = nodes.filter((n) => !hasIncoming.has(n.id));

      const context: Record<string, unknown> = { input, trigger: 'manual' };
      const visited = new Set<string>();
      const queue: WorkflowNode[] = [...roots];
      let order = 0;
      const skippedBranches = new Set<string>();

      while (queue.length > 0) {
        const node = queue.shift()!;
        if (visited.has(node.id)) continue;
        visited.add(node.id);

        const step = await prisma.executionStep.create({
          data: { executionId, nodeId: node.id, nodeType: node.type, nodeName: node.label, status: StepStatus.RUNNING, input: context as Prisma.InputJsonValue, startedAt: new Date(), order: order++ },
        });

        const stepStart = Date.now();
        let output: Record<string, unknown> = {};
        let shouldSkipBranch: string | undefined;

        try {
          const executor = NODE_EXECUTORS[node.type];
          if (!executor) throw new Error(`No executor for node type: ${node.type}`);

          const result = await executor(node, { ...context });
          output = result.output;
          shouldSkipBranch = result.shouldSkipBranch;
          Object.assign(context, { [`node_${node.id}`]: output, ...output });

          await prisma.executionStep.update({
            where: { id: step.id },
            data: { status: StepStatus.COMPLETED, output: output as Prisma.InputJsonValue, completedAt: new Date(), durationMs: Date.now() - stepStart },
          });

          eventBus.publish('execution:step', { executionId, workflowId, stepId: step.id, nodeId: node.id, nodeType: node.type, status: StepStatus.COMPLETED, output, userId });
        } catch (stepErr) {
          const errMsg = stepErr instanceof Error ? stepErr.message : String(stepErr);
          await prisma.executionStep.update({
            where: { id: step.id },
            data: { status: StepStatus.FAILED, error: errMsg, completedAt: new Date(), durationMs: Date.now() - stepStart },
          });
          eventBus.publish('execution:step', { executionId, workflowId, stepId: step.id, nodeId: node.id, nodeType: node.type, status: StepStatus.FAILED, error: errMsg, userId });
          throw stepErr;
        }

        for (const { target, condition } of adjacency.get(node.id) ?? []) {
          if (shouldSkipBranch && condition === shouldSkipBranch) { skippedBranches.add(target); continue; }
          if (!skippedBranches.has(target)) { const nextNode = nodeMap.get(target); if (nextNode) queue.push(nextNode); }
        }
      }

      const durationMs = Date.now() - startTime;
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: ExecutionStatus.COMPLETED, completedAt: new Date(), durationMs, result: context as Prisma.InputJsonValue },
      });

      eventBus.publish('execution:completed', { executionId, workflowId, userId, durationMs });
      eventBus.publish('notification:send', { userId, type: 'EXECUTION_SUCCESS', title: 'Workflow Completed', message: `Executed in ${(durationMs / 1000).toFixed(1)}s`, metadata: { executionId, workflowId } });
      logger.info('Execution completed', { executionId, durationMs });
    } catch (err) {
      const durationMs = Date.now() - startTime;
      const errorMsg = err instanceof Error ? err.message : String(err);
      await prisma.workflowExecution.update({ where: { id: executionId }, data: { status: ExecutionStatus.FAILED, completedAt: new Date(), durationMs, error: errorMsg } });
      eventBus.publish('execution:failed', { executionId, workflowId, userId, error: errorMsg, durationMs });
      eventBus.publish('notification:send', { userId, type: 'EXECUTION_FAILURE', title: 'Workflow Failed', message: `Execution failed: ${errorMsg}`, metadata: { executionId, workflowId } });
      logger.error('Execution failed', { executionId, error: errorMsg });
      throw err;
    }
  }

  async close(): Promise<void> {
    await this.worker?.close();
    logger.info('Worker closed');
  }
}

export const workflowWorker = new WorkflowWorker();
