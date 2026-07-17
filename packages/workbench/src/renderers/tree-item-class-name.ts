import type { ViewTreeItem } from '@openenvx/headless';

import styles from './view-panel.module.css';

export function treeItemClassName(
  item: ViewTreeItem,
  options: {
    isSelected: boolean;
    isHovered: boolean;
    isDragging?: boolean;
    isDragActive?: boolean;
  }
): string {
  const {
    isSelected,
    isHovered,
    isDragging = false,
    isDragActive = false,
  } = options;
  return [
    styles.treeItem,
    isSelected ? styles.treeItemSelected : '',
    isHovered ? styles.treeItemHovered : '',
    isDragging ? styles.treeItemDragging : '',
    isDragActive && !isDragging ? styles.treeItemPassive : '',
    item.locked ? styles.treeItemLocked : '',
    item.visible === false ? styles.treeItemHidden : '',
  ]
    .filter(Boolean)
    .join(' ');
}
