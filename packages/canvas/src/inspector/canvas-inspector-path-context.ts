import {
  clampTransformSize,
  getActivePage,
  getPrimaryLayer,
} from '@openenvx/core';
import type { InspectorValuePath } from '@openenvx/core';
import type {
  InspectorHostContext,
  InspectorPathContextOptions,
} from '@openenvx/headless';
import { createInspectorHostContext } from '@openenvx/headless';
import type { Transform } from '@openenvx/schema';
import { findPresetForPage, PAGE_SIZE_PRESETS } from '@openenvx/schema';

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
  const primaryLayer = getPrimaryLayer(scene);

  return {
    layerData: base.layerData,
    selectedLayerId: base.selectedLayerId,
    readPath(path: InspectorValuePath): unknown {
      if (path.startsWith('selection.layer.transform.')) {
        const key = path.slice('selection.layer.transform.'.length);
        const transform = primaryLayer?.transform;
        if (!transform) {
          return key === 'rotation' ? 0 : 0;
        }
        return transform[key as keyof Transform];
      }

      if (path.startsWith('scene.activePage.')) {
        const key = path.slice('scene.activePage.'.length);
        const page = getActivePage(scene);
        if (key === 'presetId') {
          return findPresetForPage(page)?.id ?? PAGE_SIZE_PRESETS[0]?.id ?? '';
        }
        if (key === 'dimensions') {
          const width = Math.round(page.width ?? 0);
          const height = Math.round(page.height ?? 0);
          return `${width} × ${height} px`;
        }
        return (page as unknown as Record<string, unknown>)[key];
      }

      return base.readPath(path);
    },
    writePath(path: InspectorValuePath, value: unknown): void {
      if (path.startsWith('scene.activePage.')) {
        const key = path.slice('scene.activePage.'.length);
        if (key === 'dimensions' || key === 'presetId') {
          return;
        }
      }

      if (path.startsWith('command.')) {
        const commandId = path.slice('command.'.length);
        if (
          commandId === 'canvas.resizePagePreset' &&
          typeof value === 'string'
        ) {
          void executeCommand(commandId, { presetId: value });
          return;
        }
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
