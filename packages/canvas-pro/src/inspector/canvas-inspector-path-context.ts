import {
  clampTransformSize,
  findLayerById,
  getActivePage,
} from '@openenvx/core';
import type {
  InspectorValuePath,
  InspectorHostContext,
  InspectorPathContextOptions,
} from '@openenvx/headless';
import { createInspectorHostContext } from '@openenvx/headless';
import {
  resolvePageBleedMm,
  resolvePageSafeMm,
  type Transform,
} from '@openenvx/schema';

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
  const {
    scene,
    activePageId,
    selectedLayerId,
    updateLayerTransform,
    executeCommand,
  } = options;
  const primaryLayer = selectedLayerId
    ? findLayerById(scene, selectedLayerId)
    : null;
  const activePage = getActivePage(scene, activePageId ?? undefined);

  return {
    layerData: base.layerData,
    selectedLayerId: base.selectedLayerId,
    readPath(path: InspectorValuePath): unknown {
      if (path.startsWith('scene.activePage.')) {
        const key = path.slice('scene.activePage.'.length);
        if (key === 'bleedMm') {
          return resolvePageBleedMm(activePage);
        }
        if (key === 'safeMm') {
          return resolvePageSafeMm(activePage);
        }
        return undefined;
      }

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

      if (path.startsWith('scene.activePage.')) {
        const key = path.slice('scene.activePage.'.length);
        if (key === 'bleedMm') {
          void executeCommand('canvas.setBleedMm', { bleedMm: value });
          return;
        }
        if (key === 'safeMm') {
          void executeCommand('canvas.setSafeMm', { safeMm: value });
          return;
        }
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
