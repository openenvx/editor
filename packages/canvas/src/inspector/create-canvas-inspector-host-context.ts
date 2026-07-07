import type {
  InspectorPathContextOptions,
  WorkbenchApi,
} from '@openenvx/headless';
import type { Transform } from '@openenvx/schema';

import { createCanvasInspectorHostContext } from './canvas-inspector-path-context';
import type { CanvasInspectorPathContextOptions } from './canvas-inspector-path-context';

export interface CanvasInspectorHostContextHelpers {
  api: WorkbenchApi;
  executeCommand: (commandId: string, args?: unknown) => Promise<boolean>;
}

export function createCanvasInspectorHostContextWithApi(
  options: InspectorPathContextOptions,
  helpers: CanvasInspectorHostContextHelpers
): ReturnType<typeof createCanvasInspectorHostContext> {
  const canvasOptions: CanvasInspectorPathContextOptions = {
    ...options,
    updateLayerTransform: async (layerId: string, transform: Transform) =>
      helpers.executeCommand('canvas.updateLayerTransform', {
        layerId,
        transform,
      }),
  };
  return createCanvasInspectorHostContext(canvasOptions);
}
