import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  canDeleteLayer,
  canDuplicateLayer,
  canEditLayerData,
  canReorderLayer,
  isLayerLocked,
  isLayerVisible,
} from '@openenvx/core';
import type { Layer, Scene } from '@openenvx/schema';
import {
  memo,
  useCallback,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { isHtmlTextBlockType } from '../blocks/builtin-blocks';
import { getBlockChildren } from '../tree/block-tree';
import type { BlockDragData, BlockSortDraft } from './block-dnd';
import { BlockEditorProvider, useBlockEditor } from './block-editor-context';
import { BlockSelectionMenu } from './block-selection-menu';
import { HtmlRichTextEditor } from './html-rich-text-editor';

import styles from './html-editor-pane.module.css';

export type { BlockSortDraft };

function layerDataRecord(layer: Layer): Record<string, unknown> {
  return typeof layer.data === 'object' && layer.data !== null
    ? (layer.data as Record<string, unknown>)
    : {};
}

function DropZone({
  parentId,
  children,
  empty,
  disabled,
}: {
  parentId: string;
  children: ReactNode;
  empty: boolean;
  disabled?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `zone:${parentId}`,
    data: { type: 'zone', parentId },
    disabled,
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

function orderVisibleEntries(
  layers: readonly Layer[],
  sortDraft: BlockSortDraft | null,
  parentId: string
): { child: Layer; childIndex: number }[] {
  const byId = new Map(
    layers.map(
      (child, childIndex) => [child.id, { child, childIndex }] as const
    )
  );
  const visible = layers.flatMap((child, childIndex) =>
    isLayerVisible(child) ? [{ child, childIndex }] : []
  );

  if (!(sortDraft && sortDraft.parentId === parentId)) {
    return visible;
  }

  const ordered: { child: Layer; childIndex: number }[] = [];
  for (const id of sortDraft.orderedIds) {
    const entry = byId.get(id);
    if (entry && isLayerVisible(entry.child)) {
      ordered.push(entry);
    }
  }
  return ordered.length > 0 ? ordered : visible;
}

function BlockChrome({
  layer,
  label,
  selected,
  dragDisabled,
  isDragging,
  canDuplicate,
  canRemove,
  setNodeRef,
  style,
  sortableProps,
  children,
}: {
  layer: Layer;
  label: string;
  selected: boolean;
  dragDisabled: boolean;
  isDragging: boolean;
  canDuplicate: boolean;
  canRemove: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
  style?: CSSProperties;
  sortableProps?: Record<string, unknown>;
  children: ReactNode;
}) {
  const { onSelect, onDuplicate, onRemove } = useBlockEditor();

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

  const handleDuplicate = useCallback(() => {
    onDuplicate(layer.id);
  }, [layer.id, onDuplicate]);

  const handleRemove = useCallback(() => {
    onRemove(layer.id);
  }, [layer.id, onRemove]);

  return (
    <div
      className={[
        styles.blockWrap,
        selected ? styles.blockWrapSelected : '',
        dragDisabled ? '' : styles.blockWrapDraggable,
        isDragging ? styles.blockWrapPlaceholder : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
      role="treeitem"
      style={style}
      tabIndex={selected ? 0 : -1}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      {...sortableProps}
    >
      {selected && !isDragging ? (
        <BlockSelectionMenu
          canDuplicate={canDuplicate}
          canRemove={canRemove}
          label={label}
          onDuplicate={handleDuplicate}
          onRemove={handleRemove}
        />
      ) : null}
      <div className={isDragging ? styles.blockPlaceholderContent : undefined}>
        {children}
      </div>
    </div>
  );
}

function SortableChildren({
  parentId,
  layers,
  registry,
}: {
  parentId: string;
  layers: readonly Layer[];
  registry: BlockRegistry;
}) {
  const { sortDraft } = useBlockEditor();
  const visibleEntries = orderVisibleEntries(layers, sortDraft, parentId);
  const itemIds = visibleEntries.map(({ child }) => child.id);

  return (
    <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
      {visibleEntries.map(({ child, childIndex }) => (
        <SortableBlockNode
          key={child.id}
          index={childIndex}
          layer={child}
          parentId={parentId}
          registry={registry}
        />
      ))}
    </SortableContext>
  );
}

function ContainerChildren({
  layer,
  registry,
}: {
  layer: Layer;
  registry: BlockRegistry;
}) {
  const children = getBlockChildren(layer);
  const visibleCount = children.filter(isLayerVisible).length;
  return (
    <DropZone
      disabled={isLayerLocked(layer)}
      empty={visibleCount === 0}
      parentId={layer.id}
    >
      {visibleCount > 0 ? (
        <SortableChildren
          layers={children}
          parentId={layer.id}
          registry={registry}
        />
      ) : null}
    </DropZone>
  );
}

function BlockContent({
  layer,
  registry,
  editing,
}: {
  layer: Layer;
  registry: BlockRegistry;
  editing: boolean;
}) {
  const { onSelect, onStartEdit, onCommitEdit } = useBlockEditor();
  const config = registry.get(layer.type);
  const textBlock = isHtmlTextBlockType(layer.type);
  const editable = canEditLayerData(layer);
  const acceptsChildren = config?.acceptsChildren === true;
  const data = layerDataRecord(layer);

  const handleEditableClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
    },
    [layer.id, onSelect]
  );

  const handleEditableDoubleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
      onStartEdit(layer.id);
    },
    [layer.id, onSelect, onStartEdit]
  );

  const handleEditableKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onSelect(layer.id);
      onStartEdit(layer.id);
    },
    [layer.id, onSelect, onStartEdit]
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

  if (editing && textBlock && editable) {
    return (
      <HtmlRichTextEditor
        html={String(data.html ?? '')}
        onCommit={handleCommit}
      />
    );
  }

  if (textBlock && editable) {
    return (
      <div
        className={styles.blockEditableHit}
        role="button"
        tabIndex={0}
        onClick={handleEditableClick}
        onDoubleClick={handleEditableDoubleClick}
        onKeyDown={handleEditableKeyDown}
      >
        {config.render({ data })}
      </div>
    );
  }

  return config.render({
    data,
    children: acceptsChildren ? (
      <ContainerChildren layer={layer} registry={registry} />
    ) : undefined,
  });
}

function SortableBlockNode({
  layer,
  parentId,
  index,
  registry,
}: {
  layer: Layer;
  parentId: string;
  index: number;
  registry: BlockRegistry;
}) {
  const { scene, selectedId, editingBlockId } = useBlockEditor();
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const editing = editingBlockId === layer.id;
  const reorderable = canReorderLayer(layer);
  const dragDisabled = editing || !reorderable;
  const canDuplicate = canDuplicateLayer(layer, scene);
  const canRemove = canDeleteLayer(layer, scene);

  const dragData: BlockDragData = {
    type: 'block',
    blockId: layer.id,
    parentId,
    index,
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: layer.id,
    data: dragData,
    disabled: dragDisabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!(config && isLayerVisible(layer))) {
    return null;
  }

  return (
    <BlockChrome
      canDuplicate={canDuplicate}
      canRemove={canRemove}
      dragDisabled={dragDisabled}
      isDragging={isDragging}
      label={config.label}
      layer={layer}
      selected={selected}
      setNodeRef={setNodeRef}
      sortableProps={dragDisabled ? undefined : { ...listeners, ...attributes }}
      style={style}
    >
      <BlockContent editing={editing} layer={layer} registry={registry} />
    </BlockChrome>
  );
}

function RootBlockNode({
  layer,
  registry,
}: {
  layer: Layer;
  registry: BlockRegistry;
}) {
  const { scene, selectedId, editingBlockId } = useBlockEditor();
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const canDuplicate = canDuplicateLayer(layer, scene);
  const canRemove = canDeleteLayer(layer, scene);

  if (!(config && isLayerVisible(layer))) {
    return null;
  }

  return (
    <BlockChrome
      canDuplicate={canDuplicate}
      canRemove={canRemove}
      dragDisabled
      isDragging={false}
      label={config.label}
      layer={layer}
      selected={selected}
    >
      <BlockContent
        editing={editingBlockId === layer.id}
        layer={layer}
        registry={registry}
      />
    </BlockChrome>
  );
}

export const BlockTreeRenderer = memo(
  ({
    layers,
    registry,
    scene,
    selectedId,
    editingBlockId,
    sortDraft,
    onSelect,
    onStartEdit,
    onCommitEdit,
    onDuplicate,
    onRemove,
  }: {
    layers: readonly Layer[];
    registry: BlockRegistry;
    scene: Scene;
    selectedId: string | null;
    editingBlockId: string | null;
    sortDraft: BlockSortDraft | null;
    onSelect: (id: string) => void;
    onStartEdit: (id: string) => void;
    onCommitEdit: (id: string, html: string) => void;
    onDuplicate: (id: string) => void;
    onRemove: (id: string) => void;
  }) => (
    <BlockEditorProvider
      value={{
        scene,
        selectedId,
        editingBlockId,
        sortDraft,
        onSelect,
        onStartEdit,
        onCommitEdit,
        onDuplicate,
        onRemove,
      }}
    >
      {layers.map((layer) => (
        <RootBlockNode key={layer.id} layer={layer} registry={registry} />
      ))}
    </BlockEditorProvider>
  )
);

export function BlockDragOverlayPreview({
  layer,
  registry,
}: {
  layer: Layer;
  registry: BlockRegistry;
}) {
  const config = registry.get(layer.type);
  if (!config) {
    return null;
  }
  const data = layerDataRecord(layer);
  return (
    <div className={styles.dragOverlay}>
      {config.render({
        data,
        children: config.acceptsChildren ? (
          <div className={styles.dragOverlayNested} />
        ) : undefined,
      })}
    </div>
  );
}
