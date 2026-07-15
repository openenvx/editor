import type { ProposedChange, AgentTaskEvent } from '@openenvx/agent/schemas';

export type { AgentTaskEvent };

export type TaskEmitter = (event: AgentTaskEvent) => void;

interface RequestStores {
  sceneContext?: Record<string, unknown>;
  proposedChanges: ProposedChange[];
  taskEmitter?: TaskEmitter;
}

const stores = new WeakMap<object, RequestStores>();

function getOrCreateStores(requestToken: object): RequestStores {
  let store = stores.get(requestToken);
  if (!store) {
    store = { proposedChanges: [] };
    stores.set(requestToken, store);
  }
  return store;
}

export function setSceneContext(
  requestToken: object,
  sceneContext: Record<string, unknown> | undefined
): void {
  getOrCreateStores(requestToken).sceneContext = sceneContext;
}

export function getSceneContext(
  requestToken: object
): Record<string, unknown> | undefined {
  return getOrCreateStores(requestToken).sceneContext;
}

export function getProposalStore(requestToken: object): ProposedChange[] {
  return getOrCreateStores(requestToken).proposedChanges;
}

export function setTaskEmitter(
  requestToken: object,
  emitter: TaskEmitter | undefined
): void {
  getOrCreateStores(requestToken).taskEmitter = emitter;
}

export function emitAgentTask(
  requestToken: object,
  event: AgentTaskEvent
): void {
  getOrCreateStores(requestToken).taskEmitter?.(event);
}
