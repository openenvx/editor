import type { Page } from '@xmazu/openenvxee-schema';

import { getPageRootId } from '../tree/block-tree';

export type StageClickAction =
  | { type: 'select'; layerId: string }
  | { type: 'clear' };

/**
 * Artboard click → select page root; stage padding → clear.
 * Nested blocks stopPropagation before the stage handler runs.
 */
export function resolveStageClickAction(options: {
  target: EventTarget | null;
  artboardTestId: string;
  page: Page;
  rootType?: string;
}): StageClickAction {
  const { target, artboardTestId, page, rootType } = options;
  if (
    target instanceof Element &&
    target.closest(`[data-testid="${artboardTestId}"]`)
  ) {
    const layerId = getPageRootId(page, rootType);
    if (layerId) {
      return { type: 'select', layerId };
    }
  }
  return { type: 'clear' };
}
