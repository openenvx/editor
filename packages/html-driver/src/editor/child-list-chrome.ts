import { isLayerVisible } from '@openenvx/core';
import type { Layer } from '@openenvx/core/schema';

import type { BlockSortDraft } from './block-dnd';

import styles from './html-editor-pane.module.css';

export function childListVisibleCount(children: readonly Layer[]): number {
  return children.filter(isLayerVisible).length;
}

export function childListInsertChrome(
  parentId: string,
  children: readonly Layer[],
  sortDraft: BlockSortDraft | null
): { empty: boolean; showInsertLine: boolean; visibleCount: number } {
  const visibleCount = childListVisibleCount(children);
  const showInsertLine =
    sortDraft?.parentId === parentId &&
    typeof sortDraft.placeholderIndex === 'number' &&
    !sortDraft.containerPreview;
  const empty = visibleCount === 0 && !showInsertLine;
  return { empty, showInsertLine, visibleCount };
}

export function dropZoneClassName(isOver: boolean, empty: boolean): string {
  return [
    styles.dropZone,
    isOver ? styles.dropZoneActive : '',
    empty ? styles.dropZoneEmpty : '',
  ]
    .filter(Boolean)
    .join(' ');
}
