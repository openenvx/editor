import type { Artboard } from '../schema/types';
import { cloneNodeTree } from './layer-tree';

export function createBlankArtboardLike(
  source: Artboard,
  id: string,
  name: string
): Artboard {
  const { guides: _guides, ...rest } = source;
  return { ...rest, id, name, nodes: [] };
}

export const createBlankPageLike = createBlankArtboardLike;

export function duplicateArtboardModel(
  source: Artboard,
  id: string,
  name: string
): Artboard {
  return {
    ...source,
    id,
    name,
    nodes: cloneNodeTree(source.nodes),
  };
}

export const duplicatePageModel = duplicateArtboardModel;

export function nextArtboardName(existingNames: Iterable<string>): string {
  const names = new Set(
    [...existingNames].map((name) => name.trim()).filter(Boolean)
  );
  let n = 1;
  while (names.has(`Artboard ${n}`)) {
    n += 1;
  }
  return `Artboard ${n}`;
}

export const nextPageName = nextArtboardName;

export function duplicateArtboardName(sourceName: string): string {
  const trimmed = sourceName.trim();
  return trimmed ? `${trimmed} copy` : 'Artboard copy';
}

export const duplicatePageName = duplicateArtboardName;

export function createArtboardId(): string {
  return `artboard-${crypto.randomUUID()}`;
}

export const createPageId = createArtboardId;

export function moveArtboardRelativeToTarget(
  artboards: Artboard[],
  sourceId: string,
  targetId: string,
  position: 'before' | 'after'
): Artboard[] {
  if (sourceId === targetId) {
    return artboards;
  }
  const sourceIndex = artboards.findIndex((a) => a.id === sourceId);
  const targetIndex = artboards.findIndex((a) => a.id === targetId);
  if (sourceIndex === -1 || targetIndex === -1) {
    return artboards;
  }

  const next = [...artboards];
  const [moved] = next.splice(sourceIndex, 1);
  if (!moved) {
    return artboards;
  }

  let insertIndex = next.findIndex((a) => a.id === targetId);
  if (insertIndex === -1) {
    return artboards;
  }
  if (position === 'after') {
    insertIndex += 1;
  }
  next.splice(insertIndex, 0, moved);
  return next;
}

export const movePageRelativeToTarget = moveArtboardRelativeToTarget;
