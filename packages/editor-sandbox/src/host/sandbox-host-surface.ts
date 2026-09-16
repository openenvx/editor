import type {
  Command,
  Scene,
  SceneTransaction,
  Selection,
  WorkbenchContribution,
  WorkbenchContributionDisposable,
} from '@openenvx/studio/core';

/**
 * Host surface for sandbox extensions (first-party adapter only).
 * Omits InstantiationService / PluginContext; still grants scene + commands.
 * Isolates never receive this - capability gates stay on the host bridge.
 */
export interface SandboxHostSurface {
  getSelection(): Selection;
  getScene(): Scene;
  apply(transaction: SceneTransaction): void;
  selectLayers(layerIds: string[], primaryLayerId?: string | null): void;
  onDidChangeScene(listener: () => void): () => void;
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
