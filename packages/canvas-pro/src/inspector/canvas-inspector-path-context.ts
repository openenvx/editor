import { clampTransformSize, findLayerById } from '@openenvx/core';
import type {
  InspectorValuePath,
  InspectorHostContext,
  InspectorPathContextOptions,
} from '@openenvx/headless';
import { createInspectorHostContext } from '@openenvx/headless';
import type { Transform } from '@openenvx/schema';

export interface CanvasInspectorPathContextOptions extends InspectorPathContextOptions {
  updateLayerTransform: (
    layerId: string,
    transform: Transform
  ) => void | Promise<boolean>;
}

export function createCanvasInspectorHostContext(
  options: CanvasInspectorPathContextOptions
): InspectorHostContext {
  const base = createInspectorHostContext(options);
  const { scene, selectedLayerId, updateLayerTransform, executeCommand } =
    options;
  const primaryLayer = selectedLayerId
    ? findLayerById(scene, selectedLayerId)
    : null;

  return {
    layerData: base.layerData,
    selectedLayerId: base.selectedLayerId,
    readPath(path: InspectorValuePath): unknown {
      if (path.startsWith('selection.layer.transform.')) {
        const key = path.slice('selection.layer.transform.'.length);
        const transform = primaryLayer?.transform;
        if (!transform) {
          return 0;
        }
        return transform[key as keyof Transform];
      }

      return base.readPath(path);
    },
    writePath(path: InspectorValuePath, value: unknown): void {
      if (path.startsWith('command.')) {
        const commandId = path.slice('command.'.length);
        void executeCommand(commandId);
        return;
      }

      if (selectedLayerId && path.startsWith('selection.layer.transform.')) {
        const key = path.slice('selection.layer.transform.'.length);
        const current = primaryLayer?.transform;
        if (!current) {
          return;
        }
        const patch = { [key]: value } as Partial<Transform>;
        const transform = clampTransformSize({ ...current, ...patch });
        void updateLayerTransform(selectedLayerId, transform);
        return;
      }

      base.writePath(path, value);
    },
  };
}
