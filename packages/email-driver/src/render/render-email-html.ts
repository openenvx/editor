import { BlockRegistry } from '@openenvx/html-driver';
import type { Scene } from '@openenvx/studio/schema';
import {
  applyTemplateVariables,
  artboardRulesLayout,
} from '@openenvx/studio/schema';

import { allEmailBlocks } from '../blocks/all-email-blocks';
import { renderEmailDocument } from './render-email-document';

export interface RenderEmailHtmlOptions {
  /** Values for `{{{key}}}` tokens in layer data strings. Unknown keys stay as tokens. */
  variables?: Record<string, string>;
}

/** Render the email-layout page in a scene to email-safe HTML. */
export async function renderEmailHtml(
  scene: Scene,
  options?: RenderEmailHtmlOptions
): Promise<string> {
  const resolved = options?.variables
    ? applyTemplateVariables(scene, options.variables)
    : scene;
  const page = resolved.artboards.find(
    (candidate) => artboardRulesLayout(candidate) === 'email'
  );
  if (!page) {
    throw new Error('Scene has no email layout page');
  }
  const registry = new BlockRegistry();
  for (const block of allEmailBlocks) {
    registry.register(block);
  }
  return renderEmailDocument(page, registry);
}
