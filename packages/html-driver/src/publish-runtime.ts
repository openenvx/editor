/**
 * Worker-safe runtime surface - block configs + static document render.
 * Does not pull WorkbenchShell, TipTap editors, or DnD chrome.
 */
import type { Scene } from '@openenvx/core/schema';

import { createHtmlDemoScene } from './create-html-demo-scene';

export * from './runtime';

export function createHtmlScene(): Scene {
  return createHtmlDemoScene();
}
