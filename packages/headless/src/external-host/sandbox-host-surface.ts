import type {
  Command,
  Scene,
  SceneTransaction,
  Selection,
} from '@openenvx/core';

/**
 * Narrow host surface for sandbox extensions.
 * Deliberately omits InstantiationService / PluginContext.
 */
export interface SandboxHostSurface {
  getSelection(): Selection;
  getScene(): Scene;
  apply(transaction: SceneTransaction): void;
  onDidChangeScene(listener: () => void): () => void;
  onDidChangeSelection(listener: () => void): () => void;
  executeCommand(
    commandId: string,
    args?: unknown
  ): Promise<{ executed: boolean }>;
  registerCommand(command: Command): { dispose(): void };
}
