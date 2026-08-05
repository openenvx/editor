import { resolveTextBoxFitPropertyUpdate } from '@openenvx/canvas';
import type {
  PropertyPathContextOptions,
  WorkbenchApi,
} from '@openenvx/headless';
import type { Transform } from '@xmazu/openenvxee-schema';

import { createCanvasPropertyHostContext } from './canvas-property-path-context';
import type { CanvasPropertyPathContextOptions } from './canvas-property-path-context';

interface CanvasPropertyHostContextHelpers {
  api: WorkbenchApi;
  executeCommand: (commandId: string, args?: unknown) => Promise<boolean>;
}

export function createCanvasPropertyHostContextWithApi(
  options: PropertyPathContextOptions,
  helpers: CanvasPropertyHostContextHelpers
): ReturnType<typeof createCanvasPropertyHostContext> {
  const updateProperty = (layerId: string, key: string, value: unknown) => {
    const fit = resolveTextBoxFitPropertyUpdate(
      options.scene,
      layerId,
      key,
      value
    );
    if (!fit) {
      options.updateProperty(layerId, key, value);
      return;
    }

    void helpers.executeCommand('canvas.updateLayerTransform', {
      dataPatch: fit.dataPatch,
      layerId,
      transform: fit.transform,
    });
  };

  const canvasOptions: CanvasPropertyPathContextOptions = {
    ...options,
    updateLayerTransform: async (layerId: string, transform: Transform) =>
      helpers.executeCommand('canvas.updateLayerTransform', {
        layerId,
        transform,
      }),
    updateProperty,
  };
  return createCanvasPropertyHostContext(canvasOptions);
}
