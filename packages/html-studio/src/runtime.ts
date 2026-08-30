import type { Scene } from '@openenvx/core/schema';
/**
 * Worker-safe runtime surface - block configs + static document render.
 * Does not pull WorkbenchShell, TipTap editors, or DnD chrome.
 */
import { createHtmlDemoScene as createHtmlDemoSceneImpl } from '@openenvx/html';

export * from '@openenvx/html/runtime';

export function createHtmlScene(): Scene {
  return createHtmlDemoSceneImpl();
}
