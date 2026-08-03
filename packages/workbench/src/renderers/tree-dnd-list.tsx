import {
  DndContext,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
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

interface DropIndicatorState {
  /** Pixel top for the insert line; null when highlighting a container. */
  lineTop: number | null;
  lineLeft: number;
  /** Container row highlighted for nest-into. */
  nestTargetId: string | null;
}

interface TreeDndListProps {
  viewId: string;
  items: ViewTreeItem[];
  collapsed: Set<string>;
  selectedIds: Set<string>;
  hoveredIds: Set<string>;
  onSelect: (source: unknown, options?: { additive?: boolean }) => void;
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
    onSelect: (options?: { additive?: boolean }) => void;
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
    isDropNestTarget,
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
    isDropNestTarget: boolean;
    isCollapsed: boolean;
    onSelect: (options?: { additive?: boolean }) => void;
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
          isDropNestTarget,
          isHovered,
          isSelected,
        })}
        onContextMenu={() => {
          // Keep multi-select for context actions (e.g. Create group).
          if (!isSelected) {
            onSelect();
          }
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
    const activeIdRef = useRef<string | null>(null);
    const projectionRef = useRef<DropProjection | null>(null);
    const flatItems = buildFlatTree(items, collapsed);

    const [activeId, setActiveId] = useState<string | null>(null);
    const [dropIndicator, setDropIndicator] =
      useState<DropIndicatorState | null>(null);

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

    const updateDropIndicator = useCallback(
      (clientY: number) => {
        const currentActiveId = activeIdRef.current;
        if (!currentActiveId || !containerRef.current) {
          projectionRef.current = null;
          setDropIndicator(null);
          return;
        }

        const pointerTarget = findPointerTarget(
          flatItems,
          getRowRects(),
          clientY
        );
        if (!pointerTarget) {
          projectionRef.current = null;
          setDropIndicator(null);
          return;
        }

        const row = rowRefs.current.get(pointerTarget.overId);
        const containerRect = containerRef.current.getBoundingClientRect();
        if (!row) {
          projectionRef.current = null;
          setDropIndicator(null);
          return;
        }

        const rowRect = row.getBoundingClientRect();
        const projection = getProjection(
          flatItems,
          currentActiveId,
          pointerTarget.overId,
          pointerTarget.zone
        );
        if (!projection) {
          projectionRef.current = null;
          setDropIndicator(null);
          return;
        }

        const activeItem = flatItems.find(
          (item) => item.id === currentActiveId
        );
        if (!activeItem || isInvalidMove(flatItems, activeItem, projection)) {
          projectionRef.current = null;
          setDropIndicator(null);
          return;
        }

        projectionRef.current = projection;

        if (projection.position === 'inside') {
          setDropIndicator({
            lineLeft: treePaddingLeft(projection.depth),
            lineTop: null,
            nestTargetId: projection.overId,
          });
          return;
        }

        setDropIndicator({
          lineLeft: treePaddingLeft(projection.depth),
          lineTop: getDropLineTop(
            projection.zone === 'before' ? 'before' : 'after',
            rowRect,
            containerRect.top
          ),
          nestTargetId: null,
        });
      },
      [flatItems, getRowRects]
    );

    const pointerMoveHandlerRef = useRef<
      ((event: PointerEvent) => void) | null
    >(null);

    const attachPointerMoveListener = useCallback(() => {
      const onPointerMove = (event: PointerEvent) => {
        pointerYRef.current = event.clientY;
        updateDropIndicator(event.clientY);
      };
      pointerMoveHandlerRef.current = onPointerMove;
      document.addEventListener('pointermove', onPointerMove);
    }, [updateDropIndicator]);

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
        const id = String(event.active.id);
        pointerYRef.current = pointerEvent.clientY;
        activeIdRef.current = id;
        setActiveId(id);
        updateDropIndicator(pointerEvent.clientY);
        attachPointerMoveListener();
      },
      [attachPointerMoveListener, updateDropIndicator]
    );

    const handleDragEnd = useCallback(() => {
      detachPointerMoveListener();
      const currentActiveId = activeIdRef.current;
      const clientY = pointerYRef.current;
      let commitProjection = projectionRef.current;

      activeIdRef.current = null;
      setActiveId(null);
      projectionRef.current = null;
      setDropIndicator(null);

      if (!currentActiveId) {
        return;
      }

      if (!commitProjection) {
        const pointerTarget = findPointerTarget(
          flatItems,
          getRowRects(),
          clientY
        );
        if (!pointerTarget) {
          return;
        }
        commitProjection = getProjection(
          flatItems,
          currentActiveId,
          pointerTarget.overId,
          pointerTarget.zone
        );
      }
      if (!commitProjection) {
        return;
      }

      const activeItem = flatItems.find((item) => item.id === currentActiveId);
      if (
        !activeItem ||
        isInvalidMove(flatItems, activeItem, commitProjection) ||
        isNoOpMove(flatItems, activeItem, commitProjection)
      ) {
        return;
      }

      const move = resolveMove(
        flatItems,
        items,
        currentActiveId,
        commitProjection,
        collapsed
      );
      if (!move) {
        return;
      }

      onMove(activeItem.source, move.target.source, move.position);
    }, [
      collapsed,
      detachPointerMoveListener,
      flatItems,
      getRowRects,
      items,
      onMove,
    ]);

    const handleDragCancel = useCallback(() => {
      detachPointerMoveListener();
      activeIdRef.current = null;
      setActiveId(null);
      projectionRef.current = null;
      setDropIndicator(null);
    }, [detachPointerMoveListener]);

    const isDragActive = activeId !== null;

    return (
      <DndContext
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
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
                isDropNestTarget={dropIndicator?.nestTargetId === item.id}
                isHovered={isHovered}
                isSelected={isSelected}
                item={item}
                key={`${viewId}-${item.id}`}
                onHover={() => onHoverItem(item.id)}
                onSelect={(options) => onSelect(item.source, options)}
                onToggleCollapsed={() => onToggleCollapsed(item.id)}
                renderRowContent={renderRowContent}
                rowRef={(element) => setRowRef(item.id, element)}
              />
            );
          })}

          {dropIndicator && dropIndicator.lineTop !== null ? (
            <div
              aria-hidden
              className={styles.dropIndicatorLine}
              style={{
                left: `${dropIndicator.lineLeft}px`,
                top: `${dropIndicator.lineTop}px`,
              }}
            />
          ) : null}
        </div>
      </DndContext>
    );
  }
);
