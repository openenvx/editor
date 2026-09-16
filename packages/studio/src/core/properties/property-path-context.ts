import {
  findLayerById,
  getLayerWriteMode,
  isLayerShownInLayers,
  type Scene,
} from '../backbone';
import { getNestedValue } from '../utils/nested-value';
import type { PropertyHostContext } from './property-path-resolver';
import type { PropertyValuePath } from './property-value-path';

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

export interface PropertyPathContextOptions {
  scene: Scene;
  activePageId?: string | null;
  selectedLayerId: string | null;
  layerData: Record<string, unknown> | null;
  updateProperty: (layerId: string, key: string, value: unknown) => void;
  executeCommand: (
    commandId: string,
    args?: unknown
  ) => void | Promise<boolean>;
}

export function createPropertyHostContext(
  options: PropertyPathContextOptions
): PropertyHostContext {
  const { scene, selectedLayerId, layerData, updateProperty, executeCommand } =
    options;
  const primaryLayer = selectedLayerId
    ? findLayerById(scene, selectedLayerId)
    : null;

  return {
    layerData,
    readPath(path: PropertyValuePath): unknown {
      if (path.startsWith('scene.templatePolicy.')) {
        const key = path.slice('scene.templatePolicy.'.length);
        if (!isTemplatePolicyKey(key)) {
          return undefined;
        }
        return scene.templatePolicy?.[key] ?? true;
      }

      if (path.startsWith('scene.layer.')) {
        return readLayerByIdPath(path, scene);
      }

      if (path === 'selection.layer.writeMode') {
        return primaryLayer ? getLayerWriteMode(primaryLayer) : 'free';
      }

      if (path === 'selection.layer.showInLayers') {
        return primaryLayer ? isLayerShownInLayers(primaryLayer) : true;
      }

      return readPropertyPath(path, { layerData });
    },
    selectedLayerId,
    writePath(path: PropertyValuePath, value: unknown): void {
      if (path.startsWith('scene.templatePolicy.')) {
        const key = path.slice('scene.templatePolicy.'.length);
        if (isTemplatePolicyKey(key) && typeof value === 'boolean') {
          void executeCommand('scene.setTemplatePolicy', { [key]: value });
        }
        return;
      }

      if (path.startsWith('scene.layer.')) {
        writeLayerByIdPath(path, value, updateProperty);
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

      writePropertyPath(path, value, {
        executeCommand,
        selectedLayerId,
        updateProperty,
      });
    },
  };
}

/** `scene.layer.{id}.data.{key}` */
function parseLayerByIdPath(
  path: PropertyValuePath
): { layerId: string; key: string } | null {
  const match = /^scene\.layer\.([^.]+)\.data\.(.+)$/.exec(path);
  if (!match) {
    return null;
  }
  return { key: match[2]!, layerId: match[1]! };
}

function layerDataRecord(layer: { data?: unknown }): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function readLayerByIdPath(path: PropertyValuePath, scene: Scene): unknown {
  const parsed = parseLayerByIdPath(path);
  if (!parsed) {
    return undefined;
  }
  const layer = findLayerById(scene, parsed.layerId);
  if (!layer) {
    return undefined;
  }
  const data = layerDataRecord(layer);
  if (parsed.key.includes('.')) {
    return getNestedValue(data, parsed.key);
  }
  return data[parsed.key];
}

function writeLayerByIdPath(
  path: PropertyValuePath,
  value: unknown,
  updateProperty: (layerId: string, key: string, value: unknown) => void
): void {
  const parsed = parseLayerByIdPath(path);
  if (!parsed) {
    return;
  }
  updateProperty(parsed.layerId, parsed.key, value);
}

function readPropertyPath(
  path: PropertyValuePath,
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
