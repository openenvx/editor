/**
 * Headless HTML export — no WorkbenchShell, TipTap, or component CSS.
 * Browser/editor hosts can import the same helpers from `@openenvx/email-studio`.
 */
import type { Scene as CoreScene } from '@openenvx/core/schema';
import {
  createEmailScene as createEmailSceneImpl,
  renderEmailHtml as renderEmailHtmlImpl,
  type RenderEmailHtmlOptions,
} from '@openenvx/driver-email/runtime';

import type { Scene } from './scene';

export type { Scene } from './scene';
export type { RenderEmailHtmlOptions };

export function createEmailScene(): Scene {
  return createEmailSceneImpl() as unknown as Scene;
}

/** Render the email-layout page in a scene to email-safe HTML. */
export function renderEmailHtml(
  scene: Scene,
  options?: RenderEmailHtmlOptions
): Promise<string> {
  return renderEmailHtmlImpl(scene as unknown as CoreScene, options);
}
