import { logger } from '../utils';

export type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface TypedEventBus<TEvents extends Record<string, any>> {
  publish<K extends keyof TEvents>(event: K, payload: TEvents[K]): void;
  subscribe<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): () => void;
  subscribeOnce<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void;
  unsubscribe<K extends keyof TEvents>(event: K, handler: EventHandler<TEvents[K]>): void;
  listenerCount<K extends keyof TEvents>(event: K): number;
}

import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class EventBusImpl<TEvents extends Record<string, any>> implements TypedEventBus<TEvents> {
  private readonly emitter: EventEmitter;

  constructor(maxListeners = 50) {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(maxListeners);
  }

  publish<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const eventName = String(event);
    logger.debug('Event published', { event: eventName });
    const listeners = this.emitter.listeners(eventName) as Array<EventHandler<TEvents[K]>>;
    for (const listener of listeners) {
      Promise.resolve(listener(payload)).catch((err) => {
        logger.error('Event handler error', {
          event: eventName,
          error: err instanceof Error ? err.message : String(err),
        });
      });
    }
  }

  subscribe<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): () => void {
    const eventName = String(event);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.emitter.on(eventName, handler as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return () => this.emitter.off(eventName, handler as any);
  }

  subscribeOnce<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.emitter.once(String(event), handler as any);
  }

  unsubscribe<K extends keyof TEvents>(
    event: K,
    handler: EventHandler<TEvents[K]>,
  ): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.emitter.off(String(event), handler as any);
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.emitter.listenerCount(String(event));
  }

  removeAllListeners(): void {
    this.emitter.removeAllListeners();
  }
}

// ─── Event payload definitions ────────────────────────────────────────────────

export interface WorkflowCreatedPayload { workflowId: string; userId: string; name: string; }
export interface WorkflowUpdatedPayload { workflowId: string; userId: string; changes: Record<string, unknown>; }
export interface WorkflowDeletedPayload { workflowId: string; userId: string; }
export interface WorkflowTriggeredPayload { workflowId: string; executionId: string; triggeredBy: string; input?: Record<string, unknown>; }
export interface ExecutionStartedPayload { executionId: string; workflowId: string; userId: string; }
export interface ExecutionStepPayload { executionId: string; workflowId: string; stepId: string; nodeId: string; nodeType: string; status: string; output?: Record<string, unknown>; error?: string; userId: string; }
export interface ExecutionCompletedPayload { executionId: string; workflowId: string; userId: string; durationMs: number; }
export interface ExecutionFailedPayload { executionId: string; workflowId: string; userId: string; error: string; durationMs: number; }
export interface NotificationPayload { userId: string; type: string; title: string; message: string; metadata?: Record<string, unknown>; }
export interface QueueMetricsPayload { queueName: string; waiting: number; active: number; completed: number; failed: number; delayed: number; paused: number; timestamp: string; }

export interface FlowForgeEvents {
  'workflow:created': WorkflowCreatedPayload;
  'workflow:updated': WorkflowUpdatedPayload;
  'workflow:deleted': WorkflowDeletedPayload;
  'workflow:triggered': WorkflowTriggeredPayload;
  'execution:started': ExecutionStartedPayload;
  'execution:step': ExecutionStepPayload;
  'execution:completed': ExecutionCompletedPayload;
  'execution:failed': ExecutionFailedPayload;
  'notification:send': NotificationPayload;
  'queue:metrics': QueueMetricsPayload;
}

export const eventBus = new EventBusImpl<FlowForgeEvents>();
