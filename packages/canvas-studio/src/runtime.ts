/**
 * Headless scene factory - no WorkbenchShell or component CSS.
 * Browser/editor hosts can import the same helper from `@openenvx/canvas-studio/runtime`.
 */
import { createCanvasDemoScene } from '@openenvx/canvas';

import type { Scene } from './scene';

export type { Scene } from './scene';

export function createCanvasScene(): Scene {
  return createCanvasDemoScene() as unknown as Scene;
}
