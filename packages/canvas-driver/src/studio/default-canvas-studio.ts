import { VariablesPlugin } from '@openenvx/variables';

import { DEFAULT_CANVAS_LAYOUT } from '../default-canvas-layout';
import { CanvasPlugin } from '../plugin/canvas-plugin';
import { createCanvasPropertyHostContextWithApi } from '../properties/create-canvas-property-host-context';

/** Default plugins for a canvas studio host app. */
export const DEFAULT_CANVAS_STUDIO_PLUGINS = [
  new CanvasPlugin(),
  new VariablesPlugin(),
];

/** Default workbench wiring for canvas artboard hosts. */
export const defaultCanvasStudio = {
  plugins: DEFAULT_CANVAS_STUDIO_PLUGINS,
  layout: DEFAULT_CANVAS_LAYOUT,
  createPropertyHostContext: createCanvasPropertyHostContextWithApi,
};
