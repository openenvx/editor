import type { Document, Transform } from '@openenvx/editor/schema';
import type {
  PropertyPathContextOptions,
  WorkbenchApi,
} from '@openenvx/studio';

import { resolveTextBoxFitPropertyUpdate } from '../fit-text-layer-to-content';
import { updatePropertyViaApi } from '../workbench-document-api';
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
      options.scene as Document,
      layerId,
      key,
      value
    );
    if (!fit) {
      updatePropertyViaApi(helpers.api, layerId, key, value);
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
