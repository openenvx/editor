import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { Layer } from '@openenvx/schema';
import {
  memo,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { getBlockChildren } from '../tree/block-tree';

import styles from './html-editor-pane.module.css';

function DropZone({
  parentId,
  children,
  empty,
}: {
  parentId: string;
  children: ReactNode;
  empty: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone:${parentId}`,
    data: { parentId },
  });
  return (
    <div
      className={[
        styles.dropZone,
        isOver ? styles.dropZoneActive : '',
        empty ? styles.dropZoneEmpty : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
    >
      {empty ? 'Select Blocks in the sidebar to add content' : children}
    </div>
  );
}

function BlockNode({
  layer,
  registry,
  selectedId,
  onSelect,
}: {
  layer: Layer;
  registry: BlockRegistry;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${layer.id}`,
    data: { blockId: layer.id, fromPalette: false },
    disabled: layer.type === 'html.root',
  });

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
    },
    [layer.id, onSelect]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onSelect(layer.id);
    },
    [layer.id, onSelect]
  );

  if (!config) {
    return null;
  }

  const data =
    typeof layer.data === 'object' && layer.data !== null
      ? (layer.data as Record<string, unknown>)
      : {};
  const children = getBlockChildren(layer);
  const childNodes = children.map((child) => (
    <BlockNode
      key={child.id}
      layer={child}
      onSelect={onSelect}
      registry={registry}
      selectedId={selectedId}
    />
  ));

  return (
    <div
      className={[styles.blockWrap, selected ? styles.blockWrapSelected : '']
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
      role="treeitem"
      style={{ opacity: isDragging ? 0.4 : 1 }}
      tabIndex={selected ? 0 : -1}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...(layer.type === 'html.root' ? {} : { ...listeners, ...attributes })}
    >
      {config.render({
        data,
        children: config.acceptsChildren ? (
          <DropZone empty={children.length === 0} parentId={layer.id}>
            {childNodes}
          </DropZone>
        ) : undefined,
      })}
    </div>
  );
}

export const BlockTreeRenderer = memo(
  ({
    layers,
    registry,
    selectedId,
    onSelect,
  }: {
    layers: readonly Layer[];
    registry: BlockRegistry;
    selectedId: string | null;
    onSelect: (id: string) => void;
  }) => (
    <>
      {layers.map((layer) => (
        <BlockNode
          key={layer.id}
          layer={layer}
          onSelect={onSelect}
          registry={registry}
          selectedId={selectedId}
        />
      ))}
    </>
  )
);
