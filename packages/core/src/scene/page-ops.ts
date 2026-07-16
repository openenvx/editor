import { cloneLayerTree } from './layer-tree';
import type { Page } from './types';

/** Blank page with the same layout/size settings as `source`. */
export function createBlankPageLike(
  source: Page,
  id: string,
  name: string
): Page {
  return { ...source, id, name, layers: [] };
}

/** Deep-clone a page including layers with remapped ids. */
export function duplicatePageModel(
  source: Page,
  id: string,
  name: string
): Page {
  return {
    ...source,
    id,
    name,
    layers: cloneLayerTree(source.layers),
  };
}

export function nextPageName(existingNames: Iterable<string>): string {
  const names = new Set(
    [...existingNames].map((name) => name.trim()).filter(Boolean)
  );
  let n = 1;
  while (names.has(`Page ${n}`)) {
    n += 1;
  }
  return `Page ${n}`;
}

export function duplicatePageName(sourceName: string): string {
  const trimmed = sourceName.trim();
  return trimmed ? `${trimmed} copy` : 'Page copy';
}

export function createPageId(): string {
  return `page-${crypto.randomUUID()}`;
}

/** Reorder pages so `sourceId` lands before/after `targetId`. */
export function movePageRelativeToTarget(
  pages: Page[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after'
): Page[] {
  if (sourceId === targetId) {
    return pages;
  }
  const sourceIndex = pages.findIndex((p) => p.id === sourceId);
  const targetIndex = pages.findIndex((p) => p.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return pages;
  }

  const next = [...pages];
  const [moved] = next.splice(sourceIndex, 1);
  if (!moved) {
    return pages;
  }

  let insertIndex = next.findIndex((p) => p.id === targetId);
  if (insertIndex === -1) {
    return pages;
  }
  if (position === 'after') {
    insertIndex += 1;
  }
  next.splice(insertIndex, 0, moved);
  return next;
}
