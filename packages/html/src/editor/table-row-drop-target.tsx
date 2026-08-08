import { useDroppable } from '@dnd-kit/core';
import { isLayerLocked } from '@openenvx/core';
import type { Layer } from '@xmazu/openenvxee-schema';

import { dropZoneClassName } from './child-list-chrome';

export function useTableRowChildListDropTarget(
  parentId: string,
  layer: Layer,
  empty: boolean
): { className: string; setNodeRef: (node: HTMLElement | null) => void } {
  const { isOver, setNodeRef } = useDroppable({
    data: { parentId, type: 'zone' },
    disabled: isLayerLocked(layer),
    id: `zone:${parentId}`,
  });
  return {
    className: dropZoneClassName(isOver, empty),
    setNodeRef,
  };
}
