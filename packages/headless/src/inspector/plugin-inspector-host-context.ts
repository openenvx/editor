import type { InspectorHostContext } from './inspector-path-resolver';
import type { InspectorValuePath } from './inspector-value-path';

export const PLUGIN_PATH_PREFIX = 'plugin.';

/** Command-id encoding for FieldAction `{ type: 'handler' }` through onCommand. */
export const PLUGIN_HANDLER_COMMAND_PREFIX = 'plugin.handler:';

export function encodePluginHandlerCommand(handlerId: string): string {
  return `${PLUGIN_HANDLER_COMMAND_PREFIX}${handlerId}`;
}

export function decodePluginHandlerCommand(commandId: string): string | null {
  if (!commandId.startsWith(PLUGIN_HANDLER_COMMAND_PREFIX)) {
    return null;
  }
  return commandId.slice(PLUGIN_HANDLER_COMMAND_PREFIX.length);
}

export interface PluginInspectorHostContextOptions {
  panelId: string;
  /** Mutable value bag keyed by full `plugin.<panelId>.<key>` path or bare key. */
  values: Record<string, unknown>;
  onWrite: (path: InspectorValuePath, value: unknown) => void;
}

function isPluginPath(path: InspectorValuePath, panelId: string): boolean {
  return path.startsWith(`${PLUGIN_PATH_PREFIX}${panelId}.`);
}

function valueKey(path: InspectorValuePath, panelId: string): string {
  return path.slice(`${PLUGIN_PATH_PREFIX}${panelId}.`.length);
}

/**
 * Host context for external plugin panes. Reads from a values bag; writes notify
 * the parent via {@link PluginInspectorHostContextOptions.onWrite} (typically a
 * `panel:event` with the path as handler id).
 */
export function createPluginInspectorHostContext(
  options: PluginInspectorHostContextOptions
): InspectorHostContext {
  const { panelId, values, onWrite } = options;

  return {
    selectedLayerId: panelId,
    layerData: values,
    readPath(path: InspectorValuePath): unknown {
      if (!isPluginPath(path, panelId)) {
        return undefined;
      }
      const key = valueKey(path, panelId);
      if (key in values) {
        return values[key];
      }
      return values[path];
    },
    writePath(path: InspectorValuePath, value: unknown): void {
      if (!isPluginPath(path, panelId)) {
        return;
      }
      const key = valueKey(path, panelId);
      values[key] = value;
      onWrite(path, value);
    },
  };
}
