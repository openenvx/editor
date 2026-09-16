import { VariablesPlugin } from '@openenvx/studio/plugins/variables';

import { DEFAULT_CANVAS_LAYOUT } from './default-canvas-layout';
import { CanvasPlugin } from './plugin/canvas-plugin';
import { createCanvasPropertyHostContextWithApi } from './properties/create-canvas-property-host-context';

/** Default plugins for a canvas workbench host app. */
export const DEFAULT_CANVAS_WORKBENCH_PLUGINS = [
  new CanvasPlugin(),
  new VariablesPlugin(),
];

/**
 * Default workbench wiring for canvas artboard hosts.
 * For custom plugin lists, use `new CanvasPlugin()` plus your plugins;
 * `DEFAULT_CANVAS_WORKBENCH_PLUGINS` also includes `VariablesPlugin`.
 */
export const defaultCanvasWorkbench = {
  plugins: DEFAULT_CANVAS_WORKBENCH_PLUGINS,
  layout: DEFAULT_CANVAS_LAYOUT,
  createPropertyHostContext: createCanvasPropertyHostContextWithApi,
};
