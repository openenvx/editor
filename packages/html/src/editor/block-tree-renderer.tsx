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
  WIDGET_LAYER_TYPE,
} from '@openenvx/core';
import { isTypingTarget } from '@openenvx/headless';
import type { Layer, Scene } from '@openenvx/schema';
import {
  Fragment,
  memo,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { getBlockChildren } from '../tree/block-tree';
import {
  insertLineIsVertical,
  insertLineTargetIds,
  sortInsertLineIndex,
  type BlockDragData,
  type BlockSortDraft,
} from './block-dnd';
import {
  BlockEditorProvider,
  useBlockEditor,
  type BlockEditTarget,
} from './block-editor-context';
import { BlockSelectionMenu } from './block-selection-menu';
import { HtmlRichTextEditor } from './html-rich-text-editor';
import { emitOpenEnvxHtmlWidgetClick } from './html-widget-click-handler';
import { parseRichTextAlign, type RichTextAlign } from './rich-text-align';

import styles from './html-editor-pane.module.css';

export type { BlockSortDraft };

function isRichTextBlock(registry: BlockRegistry, type: string): boolean {
  return registry.get(type)?.fields.html?.kind === 'richText';
}

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
  editing = false,
  dragDisabled,
  isDraggingGhost,
  dropContainerPreview,
  insertLineBefore,
  insertLineAfter,
  insertLineVertical,
  canDuplicate,
  canRemove,
  insideWidget = false,
  setNodeRef,
  sortableProps,
  children,
}: {
  layer: Layer;
  label: string;
  selected: boolean;
  /** Hide block chrome while TipTap owns the selection bubble. */
  editing?: boolean;
  dragDisabled: boolean;
  /** Dragging source stays put, grayed; only the insert line moves. */
  isDraggingGhost?: boolean;
  dropContainerPreview?: boolean;
  insertLineBefore?: boolean;
  insertLineAfter?: boolean;
  insertLineVertical?: boolean;
  canDuplicate: boolean;
  canRemove: boolean;
  /** True when this block is under an `openenvx.widget` ancestor (or is one). */
  insideWidget?: boolean;
  setNodeRef?: (node: HTMLElement | null) => void;
  sortableProps?: Record<string, unknown>;
  children: ReactNode;
}) {
  const { onSelect, onDuplicate, onRemove } = useBlockEditor();

  const activate = useCallback(() => {
    if (insideWidget) {
      emitOpenEnvxHtmlWidgetClick(layer.id);
    }
    onSelect(layer.id);
  }, [insideWidget, layer.id, onSelect]);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      activate();
    },
    [activate]
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
      if (editing || isTypingTarget(event.target)) {
        return;
      }
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      activate();
    },
    [activate, editing]
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
      {selected && !editing && !isDraggingGhost ? (
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
  insideWidget,
}: {
  parentId: string;
  parentType: string;
  parentData: Record<string, unknown>;
  layers: readonly Layer[];
  registry: BlockRegistry;
  insideWidget: boolean;
}) {
  const { sortDraft } = useBlockEditor();
  const visibleEntries = visibleEntriesForParent(layers);
  const itemIds = visibleEntries.map(({ child }) => child.id);
  const lineIndex = sortInsertLineIndex(sortDraft, parentId);
  const activeId = sortDraft?.parentId === parentId ? sortDraft.activeId : null;
  const verticalLine = insertLineIsVertical(
    parentType,
    parentData,
    registry.get(parentType)?.insertLineAxis
  );
  const { beforeId, afterId } = insertLineTargetIds(
    itemIds,
    activeId,
    lineIndex
  );
  const childInsideWidget = insideWidget || parentType === WIDGET_LAYER_TYPE;

  return (
    <SortableContext items={itemIds} strategy={staticSortingStrategy}>
      {visibleEntries.map(({ child, childIndex }) => (
        <SortableBlockNode
          key={child.id}
          index={childIndex}
          insertLineAfter={afterId === child.id}
          insertLineBefore={beforeId === child.id}
          insertLineVertical={verticalLine}
          insideWidget={childInsideWidget}
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
  insideWidget,
}: {
  layer: Layer;
  registry: BlockRegistry;
  insideWidget: boolean;
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
  const verticalLine = insertLineIsVertical(
    layer.type,
    parentData,
    registry.get(layer.type)?.insertLineAxis
  );
  const childInsideWidget = insideWidget || layer.type === WIDGET_LAYER_TYPE;

  return (
    <DropZone disabled={isLayerLocked(layer)} empty={empty} parentId={layer.id}>
      {visibleCount > 0 ? (
        <SortableChildren
          insideWidget={childInsideWidget}
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

function SlotPartContent({
  hostId,
  dataPath,
  part,
  registry,
}: {
  hostId: string;
  dataPath: string;
  part: Layer;
  registry: BlockRegistry;
}) {
  const { selectedId, editingTarget, onSelect, onStartEdit, onCommitEdit } =
    useBlockEditor();
  const config = registry.get(part.type);
  const textBlock = isRichTextBlock(registry, part.type);
  const editable = canEditLayerData(part);
  const data = layerDataRecord(part);
  const editing =
    editingTarget?.hostId === hostId && editingTarget.dataPath === dataPath;

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(hostId);
      if (textBlock && editable) {
        onStartEdit(hostId, dataPath);
      }
    },
    [dataPath, editable, hostId, onSelect, onStartEdit, textBlock]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      onSelect(hostId);
      if (textBlock && editable) {
        onStartEdit(hostId, dataPath);
      }
    },
    [dataPath, editable, hostId, onSelect, onStartEdit, textBlock]
  );

  const handleCommit = useCallback(
    (html: string, nextAlign?: RichTextAlign) => {
      onCommitEdit(hostId, dataPath, html, nextAlign);
    },
    [dataPath, hostId, onCommitEdit]
  );

  if (!(config && isLayerVisible(part))) {
    return null;
  }

  if (textBlock && editable) {
    return (
      <div
        className={styles.blockEditableHit}
        role="button"
        tabIndex={selectedId === hostId ? 0 : -1}
        onClick={editing ? undefined : handleClick}
        onKeyDown={editing ? undefined : handleKeyDown}
      >
        {editing
          ? config.render({
              data,
              children: (
                <HtmlRichTextEditor
                  align={parseRichTextAlign(data.align)}
                  html={String(data.html ?? '')}
                  onCommit={handleCommit}
                />
              ),
            })
          : config.render({ data })}
      </div>
    );
  }

  return (
    <div role="presentation" onClick={handleClick} onKeyDown={handleKeyDown}>
      {config.render({ data })}
    </div>
  );
}

function buildSlotNodes(
  host: Layer,
  registry: BlockRegistry
): Record<string, ReactNode> | undefined {
  const config = registry.get(host.type);
  if (!config?.slots) {
    return undefined;
  }
  const data = layerDataRecord(host);
  const slotsRaw =
    data.slots && typeof data.slots === 'object' && data.slots !== null
      ? (data.slots as Record<string, unknown>)
      : {};
  const result: Record<string, ReactNode> = {};
  for (const slotKey of Object.keys(config.slots)) {
    const parts = Array.isArray(slotsRaw[slotKey])
      ? (slotsRaw[slotKey] as Layer[])
      : [];
    result[slotKey] = parts.map((part, index) => (
      <Fragment key={part.id}>
        <SlotPartContent
          dataPath={`slots.${slotKey}.${index}.data.html`}
          hostId={host.id}
          part={part}
          registry={registry}
        />
      </Fragment>
    ));
  }
  return result;
}

function BlockContent({
  layer,
  registry,
  editing,
  insideWidget,
}: {
  layer: Layer;
  registry: BlockRegistry;
  editing: boolean;
  insideWidget: boolean;
}) {
  const { onSelect, onStartEdit, onCommitEdit } = useBlockEditor();
  const config = registry.get(layer.type);
  const textBlock = isRichTextBlock(registry, layer.type);
  const editable = canEditLayerData(layer);
  const acceptsChildren = config?.acceptsChildren === true;
  const data = layerDataRecord(layer);
  const slotNodes = buildSlotNodes(layer, registry);

  const handleEditableClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
      onStartEdit(layer.id, 'html');
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
      onStartEdit(layer.id, 'html');
    },
    [layer.id, onSelect, onStartEdit]
  );

  const handleCommit = useCallback(
    (html: string, nextAlign?: RichTextAlign) => {
      onCommitEdit(layer.id, 'html', html, nextAlign);
    },
    [layer.id, onCommitEdit]
  );

  if (!config) {
    return null;
  }

  if (editing && textBlock && editable) {
    return (
      <div className={styles.blockEditableHit}>
        {config.render({
          data,
          children: (
            <HtmlRichTextEditor
              align={parseRichTextAlign(data.align)}
              html={String(data.html ?? '')}
              onCommit={handleCommit}
            />
          ),
        })}
      </div>
    );
  }

  if (textBlock && editable) {
    return (
      <div
        className={styles.blockEditableHit}
        role="button"
        tabIndex={0}
        onClick={handleEditableClick}
        onKeyDown={handleEditableKeyDown}
      >
        {config.render({ data })}
      </div>
    );
  }

  return config.render({
    data,
    children: acceptsChildren ? (
      <ContainerChildren
        insideWidget={insideWidget}
        layer={layer}
        registry={registry}
      />
    ) : undefined,
    slots: slotNodes,
  });
}

function isEditingLayer(
  editingTarget: BlockEditTarget | null,
  layerId: string
): boolean {
  // Any in-place edit on this host (plain `html` or slot path) — disables grab cursor.
  return editingTarget?.hostId === layerId;
}

function SortableBlockNode({
  layer,
  parentId,
  index,
  registry,
  insideWidget,
  insertLineBefore = false,
  insertLineAfter = false,
  insertLineVertical = false,
}: {
  layer: Layer;
  parentId: string;
  index: number;
  registry: BlockRegistry;
  insideWidget: boolean;
  insertLineBefore?: boolean;
  insertLineAfter?: boolean;
  insertLineVertical?: boolean;
}) {
  const { scene, selectedId, editingTarget, sortDraft } = useBlockEditor();
  const config = registry.get(layer.type);
  const selected = selectedId === layer.id;
  const editing = isEditingLayer(editingTarget, layer.id);
  const reorderable = canReorderLayer(layer);
  const dragDisabled = editing || !reorderable;
  const canDuplicate = canDuplicateLayer(layer, scene);
  const canRemove = canDeleteLayer(layer, scene);
  const dropContainerPreview =
    sortDraft?.containerPreview === true &&
    sortDraft.parentId === layer.id &&
    config?.acceptsChildren === true;
  const nodeInsideWidget = insideWidget || layer.type === WIDGET_LAYER_TYPE;

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
      editing={editing}
      insertLineAfter={insertLineAfter}
      insertLineBefore={insertLineBefore}
      insertLineVertical={insertLineVertical}
      insideWidget={nodeInsideWidget}
      isDraggingGhost={isDraggingGhost}
      label={config.label}
      layer={layer}
      selected={selected}
      setNodeRef={setNodeRef}
      sortableProps={dragDisabled ? undefined : { ...listeners, ...attributes }}
    >
      <BlockContent
        editing={editing}
        insideWidget={nodeInsideWidget}
        layer={layer}
        registry={registry}
      />
    </BlockChrome>
  );
}

/** The page frame is not a selectable block — page props live in Layers + inspector. */
function RootBlockNode({
  layer,
  registry,
}: {
  layer: Layer;
  registry: BlockRegistry;
}) {
  if (!(registry.get(layer.type) && isLayerVisible(layer))) {
    return null;
  }

  return (
    <BlockContent
      editing={false}
      insideWidget={false}
      layer={layer}
      registry={registry}
    />
  );
}

export const BlockTreeRenderer = memo(
  ({
    layers,
    registry,
    scene,
    selectedId,
    editingTarget,
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
    editingTarget: BlockEditTarget | null;
    sortDraft: BlockSortDraft | null;
    onSelect: (id: string) => void;
    onStartEdit: (hostId: string, dataPath: string) => void;
    onCommitEdit: (
      hostId: string,
      dataPath: string,
      html: string,
      align?: RichTextAlign
    ) => void;
    onDuplicate: (id: string) => void;
    onRemove: (id: string) => void;
  }) => (
    <BlockEditorProvider
      value={{
        scene,
        selectedId,
        editingTarget,
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
