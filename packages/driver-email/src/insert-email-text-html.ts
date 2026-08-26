import type { CommandContext } from '@openenvx/core';
import { plainTextToHtml } from '@openenvx/core/schema';
import {
  createBlock,
  getPageRootId,
  insertAt,
  mapPageLayers,
  resolveInsertParentId,
} from '@openenvx/html';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from './block-registry';

/** Insert `email.text` with the given html when variable insert has no text target. */
export function insertEmailTextHtml(
  ctx: CommandContext,
  html: string
): boolean {
  const page = ctx.scene.getActivePage();
  if (page.layout !== 'email') {
    return false;
  }
  const registry =
    ctx.services.get(EmailBlockRegistryServiceId) ?? emailBlockRegistry;
  const config = registry.get('email.text');
  if (!config) {
    return false;
  }
  const selectedId =
    ctx.selection.primaryLayerId ?? ctx.selection.selectedLayerIds[0] ?? null;
  const rootId = getPageRootId(page, 'email.root');
  const parentId = resolveInsertParentId(
    page.layers,
    selectedId,
    rootId,
    registry
  );
  if (!parentId) {
    return false;
  }
  const block = createBlock('email.text', `email.text-${crypto.randomUUID()}`, {
    ...config.defaultData,
    html: html.includes('<') ? html : plainTextToHtml(html),
  });
  ctx.scene.apply({
    apply: (scene) =>
      mapPageLayers(scene, page.id, (layers) =>
        insertAt(layers, parentId, block, Number.POSITIVE_INFINITY)
      ),
    label: 'Insert text block',
  });
  ctx.scene.selectLayers([block.id]);
  return true;
}
