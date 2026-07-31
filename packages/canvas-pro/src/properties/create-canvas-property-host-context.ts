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
  const canvasOptions: CanvasPropertyPathContextOptions = {
    ...options,
    updateLayerTransform: async (layerId: string, transform: Transform) =>
      helpers.executeCommand('canvas.updateLayerTransform', {
        layerId,
        transform,
      }),
  };
  return createCanvasPropertyHostContext(canvasOptions);
}
