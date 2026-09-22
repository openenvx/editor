import { findNodeById, updateLayerInTree } from '@openenvx/studio/core';
import { applyNodeTransform, nodeTransform } from '@openenvx/studio/schema';

import type { SandboxHostSurface } from './sandbox-host-surface';

/** Scene adapters for widget `props.values` + transform resize. */
export function createWidgetSceneAdapters(input: {
  host: SandboxHostSurface;
  widgetLayerType: string;
}) {
  const { host, widgetLayerType } = input;
  return {
    getWidgetValues: (layerId: string): unknown => {
      const layer = findNodeById(host.getScene(), layerId);
      if (!layer || layer.type !== widgetLayerType) {
        return null;
      }
      const props = layer.props as { values?: Record<string, unknown> };
      return props.values ?? null;
    },
    setWidgetValues: (layerId: string, value: unknown): void => {
      const layer = findNodeById(host.getScene(), layerId);
      if (!layer || layer.type !== widgetLayerType) {
        return;
      }
      const values =
        value && typeof value === 'object' && !Array.isArray(value)
          ? (value as Record<string, unknown>)
          : { value };
      host.apply({
        label: 'Update widget values',
        apply: (scene) => ({
          ...scene,
          artboards: scene.artboards.map((page) => ({
            ...page,
            nodes: updateLayerInTree(page.nodes, layerId, (current) => ({
              ...current,
              props: {
                ...current.props,
                values,
              },
            })),
          })),
        }),
      });
    },
    resizeWidgetLayer: (
      layerId: string,
      width: number,
      height: number
    ): void => {
      const layer = findNodeById(host.getScene(), layerId);
      if (!layer || layer.type !== widgetLayerType) {
        return;
      }
      host.apply({
        label: 'Resize widget',
        apply: (scene) => ({
          ...scene,
          artboards: scene.artboards.map((page) => ({
            ...page,
            nodes: updateLayerInTree(page.nodes, layerId, (current) =>
              applyNodeTransform(current, {
                ...nodeTransform(current),
                width,
                height,
              })
            ),
          })),
        }),
      });
    },
  };
}
