import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragMoveEvent } from '@dnd-kit/core';
import type { ViewTreeItem } from '@openenvx/headless';
import { memo, useCallback, useRef, useState } from 'react';

import {
  buildFlatTree,
  findPointerTarget,
  getDropLineTop,
  getProjection,
  isInvalidMove,
  isNoOpMove,
  resolveMove,
  treePaddingLeft,
} from './tree-dnd-utils';
import type { DropProjection } from './tree-dnd-utils';
import { treeItemClassName } from './tree-item-class-name';

import styles from './view-panel.module.css';

export type TreeMovePosition = 'before' | 'after' | 'inside';

interface DropLineState {
  top: number;
  left: number;
  projection: DropProjection;
}

interface TreeDndListProps {
  viewId: string;
  items: ViewTreeItem[];
  collapsed: Set<string>;
  selectedIds: Set<string>;
  hoveredIds: Set<string>;
  onSelect: (source: unknown) => void;
  onHoverItem: (itemId: string) => void;
  onToggleCollapsed: (id: string) => void;
  onMove: (
    source: unknown,
    target: unknown,
    position: TreeMovePosition
  ) => void;
  renderRowContent: (props: {
    item: ViewTreeItem;
    isCollapsed: boolean;
    isSelected: boolean;
    onToggleCollapsed: () => void;
    onSelect: () => void;
  }) => React.ReactNode;
}

const DraggableTreeRow = memo(
  ({
    item,
    depth,
    isSelected,
    isHovered,
    isDragging,
    isDragActive,
    isCollapsed,
    onSelect,
    onHover,
    onToggleCollapsed,
    rowRef,
    renderRowContent,
  }: {
    item: ViewTreeItem;
    depth: number;
    isSelected: boolean;
    isHovered: boolean;
    isDragging: boolean;
    isDragActive: boolean;
    isCollapsed: boolean;
    onSelect: () => void;
    onHover: () => void;
    onToggleCollapsed: () => void;
    rowRef: (element: HTMLDivElement | null) => void;
    renderRowContent: TreeDndListProps['renderRowContent'];
  }) => {
    const { attributes, listeners, setNodeRef } = useDraggable({
      id: item.id,
      disabled: item.locked,
    });

    return (
      <div
        className={treeItemClassName(item, {
          isDragActive,
          isDragging,
          isHovered,
          isSelected,
        })}
        onContextMenu={() => {
          onSelect();
        }}
        onMouseEnter={onHover}
        ref={(element) => {
          setNodeRef(element);
          rowRef(element);
        }}
        style={{ paddingLeft: `${treePaddingLeft(depth)}px` }}
        {...attributes}
        {...listeners}
      >
        {renderRowContent({
          isCollapsed,
          isSelected,
          item,
          onSelect,
          onToggleCollapsed,
        })}
      </div>
    );
  }
);

export const TreeDndList = memo(
  ({
    viewId,
    items,
    collapsed,
    selectedIds,
    hoveredIds,
    onSelect,
    onHoverItem,
    onToggleCollapsed,
    onMove,
    renderRowContent,
  }: TreeDndListProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rowRefs = useRef(new Map<string, HTMLDivElement>());
    const pointerYRef = useRef(0);
    const dragOffsetXRef = useRef(0);
    const flatItems = buildFlatTree(items, collapsed);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropLine, setDropLine] = useState<DropLineState | null>(null);

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 6 },
      })
    );

    const setRowRef = useCallback(
      (id: string, element: HTMLDivElement | null) => {
        if (element) {
          rowRefs.current.set(id, element);
        } else {
          rowRefs.current.delete(id);
        }
      },
      []
    );

    const getRowRects = useCallback(() => {
      const rects = new Map<string, DOMRect>();
      for (const [id, element] of rowRefs.current.entries()) {
        rects.set(id, element.getBoundingClientRect());
      }
      return rects;
    }, []);

    const updateDropLine = useCallback(
      (clientY: number, offsetX: number) => {
        if (!activeId || !containerRef.current) {
          setDropLine(null);
          return;
        }

        const pointerTarget = findPointerTarget(
          flatItems,
          getRowRects(),
          clientY
        );
        if (!pointerTarget) {
          setDropLine(null);
          return;
        }

        const row = rowRefs.current.get(pointerTarget.overId);
        const containerRect = containerRef.current.getBoundingClientRect();
        if (!row) {
          setDropLine(null);
          return;
        }

        const rowRect = row.getBoundingClientRect();
        const projection = getProjection(
          flatItems,
          activeId,
          pointerTarget.overId,
          offsetX,
          pointerTarget.zone
        );
        if (!projection) {
          setDropLine(null);
          return;
        }

        const activeItem = flatItems.find((item) => item.id === activeId);
        if (!activeItem || isInvalidMove(flatItems, activeItem, projection)) {
          setDropLine(null);
          return;
        }

        setDropLine({
          left: treePaddingLeft(projection.depth),
          projection,
          top: getDropLineTop(pointerTarget.zone, rowRect, containerRect.top),
        });
      },
      [activeId, flatItems, getRowRects]
    );

    const pointerMoveHandlerRef = useRef<
      ((event: PointerEvent) => void) | null
    >(null);

    const attachPointerMoveListener = useCallback(() => {
      const onPointerMove = (event: PointerEvent) => {
        pointerYRef.current = event.clientY;
        updateDropLine(event.clientY, dragOffsetXRef.current);
      };
      pointerMoveHandlerRef.current = onPointerMove;
      document.addEventListener('pointermove', onPointerMove);
    }, [updateDropLine]);

    const detachPointerMoveListener = useCallback(() => {
      const handler = pointerMoveHandlerRef.current;
      if (handler) {
        document.removeEventListener('pointermove', handler);
        pointerMoveHandlerRef.current = null;
      }
    }, []);

    const handleDragStart = useCallback(
      (event: { active: { id: string | number }; activatorEvent: Event }) => {
        const pointerEvent = event.activatorEvent as PointerEvent;
        pointerYRef.current = pointerEvent.clientY;
        dragOffsetXRef.current = 0;
        setActiveId(String(event.active.id));
        updateDropLine(pointerEvent.clientY, 0);
        attachPointerMoveListener();
      },
      [attachPointerMoveListener, updateDropLine]
    );

    const handleDragMove = useCallback(
      (event: DragMoveEvent) => {
        dragOffsetXRef.current = event.delta.x;
        updateDropLine(pointerYRef.current, event.delta.x);
      },
      [updateDropLine]
    );

    const handleDragEnd = useCallback(() => {
      detachPointerMoveListener();
      const currentActiveId = activeId;
      const offsetX = dragOffsetXRef.current;
      const clientY = pointerYRef.current;

      setActiveId(null);
      dragOffsetXRef.current = 0;
      setDropLine(null);

      if (!currentActiveId) {
        return;
      }

      const pointerTarget = findPointerTarget(
        flatItems,
        getRowRects(),
        clientY
      );
      if (!pointerTarget) {
        return;
      }

      const projection = getProjection(
        flatItems,
        currentActiveId,
        pointerTarget.overId,
        offsetX,
        pointerTarget.zone
      );
      if (!projection) {
        return;
      }

      const activeItem = flatItems.find((item) => item.id === currentActiveId);
      if (
        !activeItem ||
        isInvalidMove(flatItems, activeItem, projection) ||
        isNoOpMove(flatItems, activeItem, projection)
      ) {
        return;
      }

      const move = resolveMove(
        flatItems,
        items,
        currentActiveId,
        projection,
        collapsed
      );
      if (!move) {
        return;
      }

      onMove(activeItem.source, move.target.source, move.position);
    }, [
      activeId,
      collapsed,
      detachPointerMoveListener,
      flatItems,
      getRowRects,
      items,
      onMove,
    ]);

    const handleDragCancel = useCallback(() => {
      detachPointerMoveListener();
      setActiveId(null);
      dragOffsetXRef.current = 0;
      setDropLine(null);
    }, [detachPointerMoveListener]);

    const isDragActive = activeId !== null;

    return (
      <DndContext
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragMove={handleDragMove}
        onDragStart={handleDragStart}
        sensors={sensors}
      >
        <div
          className={
            isDragActive
              ? `${styles.treeListContainer} ${styles.treeListDragging}`
              : styles.treeListContainer
          }
          ref={containerRef}
        >
          {flatItems.map((item) => {
            const isSelected = selectedIds.has(item.id);
            const isHovered = hoveredIds.has(item.id);
            const isCollapsed = collapsed.has(item.id);

            return (
              <DraggableTreeRow
                depth={item.depth}
                isCollapsed={isCollapsed}
                isDragActive={isDragActive}
                isDragging={activeId === item.id}
                isHovered={isHovered}
                isSelected={isSelected}
                item={item}
                key={`${viewId}-${item.id}`}
                onHover={() => onHoverItem(item.id)}
                onSelect={() => onSelect(item.source)}
                onToggleCollapsed={() => onToggleCollapsed(item.id)}
                renderRowContent={renderRowContent}
                rowRef={(element) => setRowRef(item.id, element)}
              />
            );
          })}

          {dropLine ? (
            <div
              aria-hidden
              className={styles.dropIndicatorLine}
              style={{
                left: `${dropLine.left}px`,
                top: `${dropLine.top}px`,
              }}
            />
          ) : null}
        </div>
      </DndContext>
    );
  }
);
