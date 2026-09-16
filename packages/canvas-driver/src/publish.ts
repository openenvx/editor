/** Public npm surface — keep in sync with `apps/canvas-package-demo`. */
export {
  DEFAULT_CANVAS_WORKBENCH_PLUGINS,
  defaultCanvasWorkbench,
} from './default-canvas-workbench';
export { downloadBytes } from './export/bytes-to-data-url';
export { exportCanvasDocument } from './export/browser/export-canvas-document';
export { createCanvasScene, type Scene } from './publish-runtime';
