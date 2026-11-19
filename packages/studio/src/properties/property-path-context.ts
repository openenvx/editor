import { getNestedValue, setNestedValue } from '../utils/nested-value';
import type { PropertyHostContext } from './property-path-resolver';
import type { PropertyValuePath } from './property-value-path';

export const SELECTION_LAYER_DATA_PATH_PREFIX = 'selection.layer.data.';

export function readLayerDataAtKey(
  layerData: Record<string, unknown> | null,
  key: string
): unknown {
  if (!layerData) {
    return undefined;
  }
  if (key.includes('.')) {
    return getNestedValue(layerData, key);
  }
  return layerData[key];
}

export function writeLayerDataAtKey(
  layerData: Record<string, unknown>,
  key: string,
  value: unknown
): Record<string, unknown> {
  const next = { ...layerData };
  if (key.includes('.')) {
    setNestedValue(next, key, value);
  } else {
    next[key] = value;
  }
  return next;
}

export interface PropertyPathContextOptions {
  scene: unknown;
  activeArtboardId?: string | null;
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  updateProperty: (layerId: string, key: string, value: unknown) => void;
  executeCommand: (
    commandId: string,
    args?: unknown
  ) => void | Promise<boolean>;
}

/** Generic property paths (`selection.layer.data.*`, `command.*`). Document paths live in `@openenvx/editor`. */
export function createPropertyHostContext(
  options: PropertyPathContextOptions
): PropertyHostContext {
  const { selectedLayerId, layerData, updateProperty, executeCommand } =
    options;

  return {
    layerData,
    readPath(path: PropertyValuePath): unknown {
      return readPropertyPath(path, { layerData });
    },
    selectedLayerId,
    writePath(path: PropertyValuePath, value: unknown): void {
      writePropertyPath(path, value, {
        executeCommand,
        selectedLayerId,
        updateProperty,
      });
    },
  };
}

function readPropertyPath(
  path: PropertyValuePath,
  ctx: {
    layerData: Record<string, unknown> | null;
  }
): unknown {
  if (path.startsWith(SELECTION_LAYER_DATA_PATH_PREFIX)) {
    const key = path.slice(SELECTION_LAYER_DATA_PATH_PREFIX.length);
    return readLayerDataAtKey(ctx.layerData, key);
  }

  if (path.startsWith('command.')) {
    return undefined;
  }

  return undefined;
}

function writePropertyPath(
  path: PropertyValuePath,
  value: unknown,
  ctx: {
    selectedLayerId: string | null;
    updateProperty: (layerId: string, key: string, value: unknown) => void;
    executeCommand: (
      commandId: string,
      args?: unknown
    ) => void | Promise<boolean>;
  }
): void {
  if (path.startsWith('command.')) {
    const commandId = path.slice('command.'.length);
    void ctx.executeCommand(commandId);
    return;
  }

  if (!ctx.selectedLayerId) {
    return;
  }

  if (path.startsWith('selection.layer.data.')) {
    const key = path.slice('selection.layer.data.'.length);
    ctx.updateProperty(ctx.selectedLayerId, key, value);
  }
}
