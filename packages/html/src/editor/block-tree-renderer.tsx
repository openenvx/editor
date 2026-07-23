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
import { isHtmlTextBlockType } from '../blocks/builtin-blocks';
import { getBlockChildren } from '../tree/block-tree';
import { HtmlRichTextEditor } from './html-rich-text-editor';

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
  editingBlockId,
  onSelect,
  onStartEdit,
  onCommitEdit,
}: {
  layer: Layer;
  registry: BlockRegistry;
  selectedId: string | null;
  editingBlockId: string | null;
  onSelect: (id: string) => void;
  onStartEdit: (id: string) => void;
  onCommitEdit: (id: string, html: string) => void;
}) {
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const editing = editingBlockId === layer.id;
  const textBlock = isHtmlTextBlockType(layer.type);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `block:${layer.id}`,
    data: { blockId: layer.id, fromPalette: false },
    disabled: layer.type === 'html.root' || editing,
  });

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
    },
    [layer.id, onSelect]
  );

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
    },
    [layer.id, onSelect]
  );

  const handleDoubleClick = useCallback(
    (event: MouseEvent) => {
      if (!textBlock) {
        return;
      }
      event.stopPropagation();
      onSelect(layer.id);
      onStartEdit(layer.id);
    },
    [layer.id, onSelect, onStartEdit, textBlock]
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

  const handleCommit = useCallback(
    (html: string) => {
      onCommitEdit(layer.id, html);
    },
    [layer.id, onCommitEdit]
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
      editingBlockId={editingBlockId}
      layer={child}
      onCommitEdit={onCommitEdit}
      onSelect={onSelect}
      onStartEdit={onStartEdit}
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
      onContextMenu={handleContextMenu}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      {...(layer.type === 'html.root' || editing
        ? {}
        : { ...listeners, ...attributes })}
    >
      {editing && textBlock ? (
        <HtmlRichTextEditor
          html={String(data.html ?? '')}
          onCommit={handleCommit}
        />
      ) : (
        config.render({
          data,
          children: config.acceptsChildren ? (
            <DropZone empty={children.length === 0} parentId={layer.id}>
              {childNodes}
            </DropZone>
          ) : undefined,
        })
      )}
    </div>
  );
}

export const BlockTreeRenderer = memo(
  ({
    layers,
    registry,
    selectedId,
    editingBlockId,
    onSelect,
    onStartEdit,
    onCommitEdit,
  }: {
    layers: readonly Layer[];
    registry: BlockRegistry;
    selectedId: string | null;
    editingBlockId: string | null;
    onSelect: (id: string) => void;
    onStartEdit: (id: string) => void;
    onCommitEdit: (id: string, html: string) => void;
  }) => (
    <>
      {layers.map((layer) => (
        <BlockNode
          key={layer.id}
          editingBlockId={editingBlockId}
          layer={layer}
          onCommitEdit={onCommitEdit}
          onSelect={onSelect}
          onStartEdit={onStartEdit}
          registry={registry}
          selectedId={selectedId}
        />
      ))}
    </>
  )
);
