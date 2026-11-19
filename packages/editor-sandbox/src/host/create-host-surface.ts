import {
  DocumentStoreServiceId,
  type DocumentStore,
  type DocumentTransaction,
} from '@openenvx/editor/host-surface';
import type { Document } from '@openenvx/editor/schema';
import type {
  Command,
  WorkbenchApi,
  WorkbenchContribution,
  WorkbenchContributionDisposable,
} from '@openenvx/studio';

import type { SandboxHostSurface } from './sandbox-host-surface';

function requireStore(api: WorkbenchApi): DocumentStore {
  const store = api.getService(DocumentStoreServiceId);
  if (!store) {
    throw new Error('DocumentStore is not registered');
  }
  return store;
}

/**
 * Build a narrow sandbox host surface from public {@link WorkbenchApi} fields.
 * Tracked disposables are disposed when the returned mount disposer runs.
 */
export function createSandboxHostSurface(
  api: WorkbenchApi,
  trackDisposable: (disposable: WorkbenchContributionDisposable) => void
): SandboxHostSurface {
  return {
    getSelection: () => requireStore(api).getSession(),
    getDocument: (): Document => requireStore(api).getDocument(),
    apply: (transaction: DocumentTransaction) =>
      requireStore(api).apply(transaction),
    selectNodes: (layerIds, primaryNodeId) =>
      requireStore(api).selectNodes(layerIds, primaryNodeId ?? null),
    onDidChangeDocument: (listener) =>
      requireStore(api).onDidChangeDocument(() => listener()).dispose,
    onDidChangeSelection: (listener) =>
      api.events.onDidChangeSelection(() => listener()).dispose,
    executeCommand: async (commandId, args) => {
      const executed = await api.executeCommand(commandId, args);
      return { executed };
    },
    registerCommand: (command: Command) => {
      api.commands.register(command);
      const disposable: WorkbenchContributionDisposable = {
        dispose: () => {
          api.commands.unregister(command.id);
        },
      };
      trackDisposable(disposable);
      return disposable;
    },
    registerWorkbenchContributions: (
      ...contributions: WorkbenchContribution[]
    ) => {
      const disposable = api.registerWorkbenchContributions(...contributions);
      trackDisposable(disposable);
      return disposable;
    },
  };
}
