import {
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useCallback } from 'react';
import type { CSSProperties } from 'react';

const POINTER_ACTIVATION = { activationConstraint: { distance: 6 } } as const;

export function useSortableContainerSensors() {
  return useSensors(useSensor(PointerSensor, POINTER_ACTIVATION));
}

export function useSortableOrderDragEnd(
  sortableIds: string[],
  onOrder: (orderedIds: string[]) => void
) {
  return useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }
      const oldIndex = sortableIds.indexOf(String(active.id));
      const newIndex = sortableIds.indexOf(String(over.id));
      if (oldIndex === -1 || newIndex === -1) {
        return;
      }
      onOrder(arrayMove(sortableIds, oldIndex, newIndex));
    },
    [sortableIds, onOrder]
  );
}

export function sortableDragStyle(
  transform: { x: number; y: number; scaleX: number; scaleY: number } | null,
  transition: string | undefined,
  isDragging: boolean
): CSSProperties {
  return {
    opacity: isDragging ? 0.6 : undefined,
    transform: CSS.Transform.toString(transform),
    transition,
  };
}
