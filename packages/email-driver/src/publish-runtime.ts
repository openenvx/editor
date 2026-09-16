/**
 * Headless HTML export - no WorkbenchShell, TipTap, or component CSS.
 */
import type { Scene as CoreScene } from '@openenvx/studio/schema';

import { createEmailDemoScene } from './create-email-demo-scene';
import type { Scene } from './opaque-scene';
import {
  renderEmailHtml as renderEmailHtmlImpl,
  type RenderEmailHtmlOptions,
} from './render/render-email-html';

export type { Scene } from './opaque-scene';
export type { RenderEmailHtmlOptions };

export function createEmailScene(): Scene {
  return createEmailDemoScene() as unknown as Scene;
}

/** Render the email-layout page in a scene to email-safe HTML. */
export function renderEmailHtml(
  scene: Scene,
  options?: RenderEmailHtmlOptions
): Promise<string> {
  return renderEmailHtmlImpl(scene as unknown as CoreScene, options);
}
