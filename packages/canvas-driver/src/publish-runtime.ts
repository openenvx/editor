import type { Document } from '@openenvx/editor/schema';

/**
 * Headless scene factory - no WorkbenchShell or component CSS.
 */
import { createCanvasDemoScene } from './plugin/canvas-plugin';

export type { Document } from '@openenvx/editor/schema';

export function createCanvasScene(): Document {
  return createCanvasDemoScene();
}
