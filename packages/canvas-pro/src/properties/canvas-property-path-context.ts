import {
  clampTransformSize,
  findLayerById,
  getActivePage,
  getLayerWriteMode,
  isLayerShownInLayers,
} from '@openenvx/core';
import type {
  PropertyValuePath,
  PropertyHostContext,
  PropertyPathContextOptions,
} from '@openenvx/headless';
import { createPropertyHostContext } from '@openenvx/headless';
import {
  resolvePageBleedMm,
  resolvePageSafeMm,
  type Transform,
} from '@openenvx/schema';

export interface CanvasPropertyPathContextOptions extends PropertyPathContextOptions {
  updateLayerTransform: (
    layerId: string,
    transform: Transform
  ) => void | Promise<boolean>;
}

const TEMPLATE_POLICY_KEYS = [
  'allowDeleteLayers',
  'allowDuplicateLayers',
  'allowInsertLayers',
  'allowPageResize',
] as const;

type TemplatePolicyKey = (typeof TEMPLATE_POLICY_KEYS)[number];

function isTemplatePolicyKey(key: string): key is TemplatePolicyKey {
  return (TEMPLATE_POLICY_KEYS as readonly string[]).includes(key);
}

export function createCanvasPropertyHostContext(
  options: CanvasPropertyPathContextOptions
): PropertyHostContext {
  const base = createPropertyHostContext(options);
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
    readPath(path: PropertyValuePath): unknown {
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

      if (path.startsWith('scene.templatePolicy.')) {
        const key = path.slice('scene.templatePolicy.'.length);
        if (!isTemplatePolicyKey(key)) {
          return undefined;
        }
        return scene.templatePolicy?.[key] ?? true;
      }

      if (path.startsWith('selection.layer.transform.')) {
        const key = path.slice('selection.layer.transform.'.length);
        const transform = primaryLayer?.transform;
        if (!transform) {
          return 0;
        }
        return transform[key as keyof Transform];
      }

      if (path === 'selection.layer.writeMode') {
        return primaryLayer ? getLayerWriteMode(primaryLayer) : 'free';
      }

      if (path === 'selection.layer.showInLayers') {
        return primaryLayer ? isLayerShownInLayers(primaryLayer) : true;
      }

      return base.readPath(path);
    },
    writePath(path: PropertyValuePath, value: unknown): void {
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

      if (path.startsWith('scene.templatePolicy.')) {
        const key = path.slice('scene.templatePolicy.'.length);
        if (isTemplatePolicyKey(key) && typeof value === 'boolean') {
          void executeCommand('scene.setTemplatePolicy', { [key]: value });
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

      if (path === 'selection.layer.writeMode') {
        void executeCommand('scene.setLayerWriteMode', { writeMode: value });
        return;
      }

      if (path === 'selection.layer.showInLayers') {
        void executeCommand('scene.setLayerShowInLayers', {
          showInLayers: value,
        });
        return;
      }

      base.writePath(path, value);
    },
  };
}
