import type {
  Command,
  Document,
  DocumentTransaction,
  EditorSession,
  WorkbenchContribution,
  WorkbenchContributionDisposable,
} from '@openenvx/studio';

/**
 * Host surface for sandbox extensions (first-party adapter only).
 * Omits InstantiationService / PluginContext; still grants scene + commands.
 * Isolates never receive this - capability gates stay on the host bridge.
 */
export interface SandboxHostSurface {
  getSelection(): EditorSession;
  getDocument(): Document;
  apply(transaction: DocumentTransaction): void;
  selectNodes(layerIds: string[], primaryNodeId?: string | null): void;
  onDidChangeDocument(listener: () => void): () => void;
  onDidChangeSelection(listener: () => void): () => void;
  executeCommand(
    commandId: string,
    args?: unknown
  ): Promise<{ executed: boolean }>;
  registerCommand(command: Command): { dispose(): void };
  registerWorkbenchContributions(
    ...contributions: WorkbenchContribution[]
  ): WorkbenchContributionDisposable;
}
