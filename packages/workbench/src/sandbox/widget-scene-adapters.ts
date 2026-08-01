import { findLayerById, updateLayerInTree } from '@openenvx/core';
import type { SandboxHostSurface } from '@openenvx/headless';

/** Scene adapters for widget `data.values` + transform resize. */
export function createWidgetSceneAdapters(input: {
  host: SandboxHostSurface;
  widgetLayerType: string;
}) {
  const { host, widgetLayerType } = input;
  return {
    getWidgetValues: (layerId: string): unknown => {
      const layer = findLayerById(host.getScene(), layerId);
      if (!layer || layer.type !== widgetLayerType) {
        return null;
      }
      const data = layer.data as { values?: Record<string, unknown> };
      return data.values ?? null;
    },
    setWidgetValues: (layerId: string, value: unknown): void => {
      const layer = findLayerById(host.getScene(), layerId);
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
          pages: scene.pages.map((page) => ({
            ...page,
            layers: updateLayerInTree(page.layers, layerId, (current) => ({
              ...current,
              data: {
                ...(current.data as Record<string, unknown>),
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
      const layer = findLayerById(host.getScene(), layerId);
      if (!layer) {
        return;
      }
      host.apply({
        label: 'Resize widget',
        apply: (scene) => ({
          ...scene,
          pages: scene.pages.map((page) => ({
            ...page,
            layers: updateLayerInTree(page.layers, layerId, (current) => {
              const prev = current.transform ?? {
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                rotation: 0,
                opacity: 1,
              };
              return {
                ...current,
                transform: {
                  ...prev,
                  width,
                  height,
                },
              };
            }),
          })),
        }),
      });
    },
  };
}
