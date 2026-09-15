/**
 * Headless scene factory - no WorkbenchShell or component CSS.
 */
import { createCanvasDemoScene } from './plugin/canvas-plugin';
import type { Scene } from './studio/scene';

export type { Scene } from './studio/scene';

export function createCanvasScene(): Scene {
  return createCanvasDemoScene() as unknown as Scene;
}
