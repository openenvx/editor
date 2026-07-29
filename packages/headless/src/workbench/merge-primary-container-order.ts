/** Minimal shape for merging drag-reordered panel ids back into primary sidebar order. */
export interface PrimarySidebarOrderEntry {
  id: string;
  sidebarBehavior: string;
}

/**
 * Interleaves a reordered panel id list with fixed dropdown/command slots in
 * primary sidebar display order.
 */
export function mergePrimaryContainerOrder(
  containers: PrimarySidebarOrderEntry[],
  panelOrder: string[]
): string[] {
  const next: string[] = [];
  let panelCursor = 0;
  for (const container of containers) {
    if (container.sidebarBehavior === 'panel') {
      const id = panelOrder[panelCursor];
      if (id) {
        next.push(id);
      }
      panelCursor += 1;
    } else {
      next.push(container.id);
    }
  }
  return next;
}
