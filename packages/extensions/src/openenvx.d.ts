import type {
  SandboxHostMethod,
  SandboxUiSelection,
} from './protocol/sandbox/types';
import type {
  WidgetFaceRenderResult,
  WidgetRegistryEntry,
} from './protocol/widget-host-api';

export type { WidgetFaceRenderResult };

/** Duplex channel between isolate and showUI iframe (`postToUI` on the wire). */
interface OpenEnvxUiChannel {
  onmessage: ((event: { data: unknown }) => void) | null;
  postMessage(pluginMessage: unknown): Promise<unknown>;
}

/** Widget face API installed by the workbench sandbox bootstrap. */
interface OpenEnvxWidgetHost {
  rendering: boolean;
  applyProps: ((patch: Record<string, unknown>) => void | Promise<void>) | null;
  _endRenderPass: (() => void) | null;
  register(entry: WidgetRegistryEntry): void;
  useSyncedState<T>(
    key: string,
    init: T | (() => T)
  ): [T, (next: T | ((prev: T) => T)) => void | Promise<void>];
}

/** Figma-shaped host bridge injected into QuickJS isolates only. */
interface OpenEnvxHostBridge {
  ui: OpenEnvxUiChannel;
  call(method: SandboxHostMethod, params?: unknown): Promise<unknown>;
  getSelection(): Promise<SandboxUiSelection | unknown>;
  getPageId(): Promise<string | null>;
  executeCommand(commandId: string, args?: unknown): Promise<unknown>;
  showUI(
    html: string,
    options?: { width?: number; height?: number }
  ): Promise<unknown>;
  resizeUI(width: number, height: number): Promise<unknown>;
  closeUI(): Promise<unknown>;
  notify(message: string): Promise<unknown>;
  closePlugin(): Promise<unknown>;
  getClientStorage(key: string): Promise<unknown>;
  setClientStorage(key: string, value: unknown): Promise<unknown>;
  getSyncedState(): Promise<Record<string, unknown>>;
  setSyncedState(value: Record<string, unknown>): Promise<unknown>;
  resizeWidget(width: number, height: number): Promise<unknown>;
  widget: OpenEnvxWidgetHost;
}

declare global {
  const openenvx: OpenEnvxHostBridge;
}
