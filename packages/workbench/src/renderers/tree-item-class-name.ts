import type { ViewTreeItem } from '@openenvx/core';

import styles from './view-panel.module.css';

export function treeItemClassName(
  item: ViewTreeItem,
  options: {
    isSelected: boolean;
    isHovered: boolean;
    isDragging?: boolean;
    isDragActive?: boolean;
    isDropNestTarget?: boolean;
  }
): string {
  const {
    isSelected,
    isHovered,
    isDragging = false,
    isDragActive = false,
    isDropNestTarget = false,
  } = options;
  return [
    styles.treeItem,
    isSelected ? styles.treeItemSelected : '',
    isHovered ? styles.treeItemHovered : '',
    isDragging ? styles.treeItemDragging : '',
    isDragActive && !isDragging ? styles.treeItemPassive : '',
    isDropNestTarget ? styles.treeItemDropNest : '',
    item.locked ? styles.treeItemLocked : '',
    item.visible === false ? styles.treeItemHidden : '',
  ]
    .filter(Boolean)
    .join(' ');
}
