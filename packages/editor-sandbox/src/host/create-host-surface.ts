import type {
  Command,
  Document,
  DocumentTransaction,
  WorkbenchApi,
  WorkbenchContributionDisposable,
} from '@openenvx/studio';

import type { SandboxHostSurface } from './sandbox-host-surface';

/**
 * Build a narrow sandbox host surface from public {@link WorkbenchApi} fields.
 * Tracked disposables are disposed when the returned mount disposer runs.
 */
export function createSandboxHostSurface(
  api: WorkbenchApi,
  trackDisposable: (disposable: WorkbenchContributionDisposable) => void
): SandboxHostSurface {
  return {
    getSelection: () => api.scene.getSession(),
    getDocument: (): Document => api.scene.getDocument(),
    apply: (transaction: DocumentTransaction) => api.scene.apply(transaction),
    selectNodes: (layerIds, primaryNodeId) =>
      api.selectNodes(layerIds, primaryNodeId ?? null),
    onDidChangeDocument: (listener) =>
      api.scene.onDidChangeDocument(() => listener()).dispose,
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
    registerWorkbenchContributions: (...contributions) => {
      const disposable = api.registerWorkbenchContributions(...contributions);
      trackDisposable(disposable);
      return disposable;
    },
  };
}
