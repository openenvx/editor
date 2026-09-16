import type { Scene } from './opaque-scene';
/**
 * Headless scene factory - no WorkbenchShell or component CSS.
 */
import { createCanvasDemoScene } from './plugin/canvas-plugin';

export type { Scene } from './opaque-scene';

export function createCanvasScene(): Scene {
  return createCanvasDemoScene() as unknown as Scene;
}
