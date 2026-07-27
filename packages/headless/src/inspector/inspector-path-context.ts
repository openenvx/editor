import type { Scene } from '@openenvx/core';

import { getNestedValue } from '../utils/nested-value';
import type { InspectorHostContext } from './inspector-path-resolver';
import type { InspectorValuePath } from './inspector-value-path';

export interface InspectorPathContextOptions {
  scene: Scene;
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  updateProperty: (layerId: string, key: string, value: unknown) => void;
  executeCommand: (
    commandId: string,
    args?: unknown
  ) => void | Promise<boolean>;
}

export function createInspectorHostContext(
  options: InspectorPathContextOptions
): InspectorHostContext {
  const { selectedLayerId, layerData, updateProperty, executeCommand } =
    options;

  return {
    layerData,
    readPath(path: InspectorValuePath): unknown {
      return readInspectorPath(path, { layerData });
    },
    selectedLayerId,
    writePath(path: InspectorValuePath, value: unknown): void {
      writeInspectorPath(path, value, {
        executeCommand,
        selectedLayerId,
        updateProperty,
      });
    },
  };
}

function readInspectorPath(
  path: InspectorValuePath,
  ctx: {
    layerData: Record<string, unknown> | null;
  }
): unknown {
  if (path.startsWith('selection.layer.data.')) {
    const key = path.slice('selection.layer.data.'.length);
    if (!ctx.layerData) {
      return undefined;
    }
    if (key.includes('.')) {
      return getNestedValue(ctx.layerData, key);
    }
    return ctx.layerData[key];
  }

  if (path.startsWith('command.')) {
    return undefined;
  }

  return undefined;
}

function writeInspectorPath(
  path: InspectorValuePath,
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
