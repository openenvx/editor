import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  type SortingStrategy,
} from '@dnd-kit/sortable';
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
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { isHtmlTextBlockType } from '../blocks/builtin-blocks';
import { getBlockChildren } from '../tree/block-tree';
import {
  insertLineIsVertical,
  insertLineTargetIds,
  sortInsertLineIndex,
  type BlockDragData,
  type BlockSortDraft,
} from './block-dnd';
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

/** GrapesJS-style insert marker for empty containers only. */
function DropInsertLine({ vertical = false }: { vertical?: boolean }) {
  return (
    <div
      aria-hidden
      className={[
        styles.dropInsertLine,
        vertical ? styles.dropInsertLineVertical : '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}

/** Keep items put during drag — preview uses an insert line, not live swaps. */
const staticSortingStrategy: SortingStrategy = () => null;

function visibleEntriesForParent(
  layers: readonly Layer[]
): { child: Layer; childIndex: number }[] {
  return layers.flatMap((child, childIndex) =>
    isLayerVisible(child) ? [{ child, childIndex }] : []
  );
}

function BlockChrome({
  layer,
  label,
  selected,
  dragDisabled,
  isDraggingGhost,
  dropContainerPreview,
  insertLineBefore,
  insertLineAfter,
  insertLineVertical,
  canDuplicate,
  canRemove,
  setNodeRef,
  sortableProps,
  children,
}: {
  layer: Layer;
  label: string;
  selected: boolean;
  dragDisabled: boolean;
  /** Dragging source stays put, grayed; only the insert line moves. */
  isDraggingGhost?: boolean;
  dropContainerPreview?: boolean;
  insertLineBefore?: boolean;
  insertLineAfter?: boolean;
  insertLineVertical?: boolean;
  canDuplicate: boolean;
  canRemove: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
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

  const lineClass = insertLineVertical
    ? {
        before: styles.blockWrapInsertLineBeforeVertical,
        after: styles.blockWrapInsertLineAfterVertical,
      }
    : {
        before: styles.blockWrapInsertLineBefore,
        after: styles.blockWrapInsertLineAfter,
      };

  return (
    <div
      className={[
        styles.blockWrap,
        selected ? styles.blockWrapSelected : '',
        dragDisabled ? '' : styles.blockWrapDraggable,
        isDraggingGhost ? styles.blockWrapDraggingGhost : '',
        dropContainerPreview ? styles.blockWrapDropContainer : '',
        insertLineBefore ? lineClass.before : '',
        insertLineAfter ? lineClass.after : '',
      ]
        .filter(Boolean)
        .join(' ')}
      ref={setNodeRef}
      role="treeitem"
      tabIndex={selected ? 0 : -1}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onKeyDown={handleKeyDown}
      {...sortableProps}
    >
      {selected && !isDraggingGhost ? (
        <BlockSelectionMenu
          canDuplicate={canDuplicate}
          canRemove={canRemove}
          label={label}
          onDuplicate={handleDuplicate}
          onRemove={handleRemove}
        />
      ) : null}
      {children}
    </div>
  );
}

function SortableChildren({
  parentId,
  parentType,
  parentData,
  layers,
  registry,
}: {
  parentId: string;
  parentType: string;
  parentData: Record<string, unknown>;
  layers: readonly Layer[];
  registry: BlockRegistry;
}) {
  const { sortDraft } = useBlockEditor();
  const visibleEntries = visibleEntriesForParent(layers);
  const itemIds = visibleEntries.map(({ child }) => child.id);
  const lineIndex = sortInsertLineIndex(sortDraft, parentId);
  const activeId = sortDraft?.parentId === parentId ? sortDraft.activeId : null;
  const verticalLine = insertLineIsVertical(parentType, parentData);
  const { beforeId, afterId } = insertLineTargetIds(
    itemIds,
    activeId,
    lineIndex
  );

  return (
    <SortableContext items={itemIds} strategy={staticSortingStrategy}>
      {visibleEntries.map(({ child, childIndex }) => (
        <SortableBlockNode
          key={child.id}
          index={childIndex}
          insertLineAfter={afterId === child.id}
          insertLineBefore={beforeId === child.id}
          insertLineVertical={verticalLine}
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
  const { sortDraft } = useBlockEditor();
  const children = getBlockChildren(layer);
  const visibleCount = children.filter(isLayerVisible).length;
  const showInsertLine =
    sortDraft?.parentId === layer.id &&
    typeof sortDraft.placeholderIndex === 'number' &&
    !sortDraft.containerPreview;
  const empty = visibleCount === 0 && !showInsertLine;
  const parentData = layerDataRecord(layer);
  const verticalLine = insertLineIsVertical(layer.type, parentData);

  return (
    <DropZone disabled={isLayerLocked(layer)} empty={empty} parentId={layer.id}>
      {visibleCount > 0 ? (
        <SortableChildren
          layers={children}
          parentData={parentData}
          parentId={layer.id}
          parentType={layer.type}
          registry={registry}
        />
      ) : showInsertLine ? (
        <DropInsertLine vertical={verticalLine} />
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
  insertLineBefore = false,
  insertLineAfter = false,
  insertLineVertical = false,
}: {
  layer: Layer;
  parentId: string;
  index: number;
  registry: BlockRegistry;
  insertLineBefore?: boolean;
  insertLineAfter?: boolean;
  insertLineVertical?: boolean;
}) {
  const { scene, selectedId, editingBlockId, sortDraft } = useBlockEditor();
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const editing = editingBlockId === layer.id;
  const reorderable = canReorderLayer(layer);
  const dragDisabled = editing || !reorderable;
  const canDuplicate = canDuplicateLayer(layer, scene);
  const canRemove = canDeleteLayer(layer, scene);
  const dropContainerPreview =
    sortDraft?.containerPreview === true &&
    sortDraft.parentId === layer.id &&
    config?.acceptsChildren === true;

  const dragData: BlockDragData = {
    type: 'block',
    blockId: layer.id,
    parentId,
    index,
    acceptsChildren: config?.acceptsChildren === true,
  };

  const { attributes, listeners, setNodeRef } = useSortable({
    id: layer.id,
    data: dragData,
    disabled: dragDisabled,
    animateLayoutChanges: () => false,
  });

  // Source stays put and grayed; only the insert line / container highlight moves.
  const isDraggingGhost = sortDraft?.activeId === layer.id;

  if (!(config && isLayerVisible(layer))) {
    return null;
  }

  return (
    <BlockChrome
      canDuplicate={canDuplicate}
      canRemove={canRemove}
      dragDisabled={dragDisabled}
      dropContainerPreview={dropContainerPreview}
      insertLineAfter={insertLineAfter}
      insertLineBefore={insertLineBefore}
      insertLineVertical={insertLineVertical}
      isDraggingGhost={isDraggingGhost}
      label={config.label}
      layer={layer}
      selected={selected}
      setNodeRef={setNodeRef}
      sortableProps={dragDisabled ? undefined : { ...listeners, ...attributes }}
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
