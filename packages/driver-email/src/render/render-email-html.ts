import type { Scene } from '@openenvx/core/schema';
import { BlockRegistry } from '@openenvx/html/runtime';

import { allEmailBlocks } from '../blocks/all-email-blocks';
import { renderEmailDocument } from './render-email-document';

/** Render the email-layout page in a scene to email-safe HTML. */
export async function renderEmailHtml(scene: Scene): Promise<string> {
  const page = scene.pages.find((candidate) => candidate.layout === 'email');
  if (!page) {
    throw new Error('Scene has no email layout page');
  }
  const registry = new BlockRegistry();
  for (const block of allEmailBlocks) {
    registry.register(block);
  }
  return renderEmailDocument(page, registry);
}
