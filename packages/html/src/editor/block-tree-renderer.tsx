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
import type { Layer, Scene } from '@openenvx/core/schema';
import {
  memo,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import type { BlockRegistry } from '../block-registry';
import { getBlockChildren } from '../tree/block-tree';
import { BlockChrome } from './block-chrome';
import { useBlockChromeHostProps } from './block-chrome-host-context';
import {
  childrenUseInlineChrome,
  insertLineIsVertical,
  insertLineTargetIds,
  resolveInsertLineAxis,
  sortInsertLineIndex,
  type BlockDragData,
  type BlockSortDraft,
} from './block-dnd';
import {
  BlockEditorProvider,
  useBlockEditor,
  type BlockEditTarget,
  type BlockImageTarget,
} from './block-editor-context';
import { childListInsertChrome, dropZoneClassName } from './child-list-chrome';
import { HtmlRichTextEditorLazy } from './lazy-rich-text-editor';
import {
  primaryImageFieldKey,
  resolveImageFieldsInData,
} from './primary-image-field';
import { parseRichTextAlign, type RichTextAlign } from './rich-text-align';
import { resolveRichTextToolbar } from './rich-text-toolbar';
import { buildSlotNodes } from './slot-part-content';
import { useTableRowChildListDropTarget } from './table-row-drop-target';

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
    <div className={dropZoneClassName(isOver, empty)} ref={setNodeRef}>
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
  const chromeDisplayFor = (type: string) => registry.get(type)?.chromeDisplay;
  const verticalLine = insertLineIsVertical(
    parentType,
    parentData,
    resolveInsertLineAxis(
      registry.get(parentType)?.insertLineAxis,
      childrenUseInlineChrome(layers, chromeDisplayFor)
    )
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
  const { empty, showInsertLine, visibleCount } = childListInsertChrome(
    layer.id,
    children,
    sortDraft
  );
  const parentData = layerDataRecord(layer);
  const chromeDisplayFor = (type: string) => registry.get(type)?.chromeDisplay;
  const verticalLine = insertLineIsVertical(
    layer.type,
    parentData,
    resolveInsertLineAxis(
      registry.get(layer.type)?.insertLineAxis,
      childrenUseInlineChrome(children, chromeDisplayFor)
    )
  );
  const childInsideWidget = insideWidget || layer.type === WIDGET_LAYER_TYPE;
  const childContainerHost =
    registry.get(layer.type)?.childContainerHost ?? 'default';

  const childNodes = (
    <>
      {visibleCount > 0 ? (
        <SortableChildren
          insideWidget={childInsideWidget}
          layers={children}
          parentData={parentData}
          parentId={layer.id}
          parentType={layer.type}
          registry={registry}
        />
      ) : null}
      {showInsertLine ? <DropInsertLine vertical={verticalLine} /> : null}
    </>
  );

  if (childContainerHost === 'table-row') {
    return childNodes;
  }

  return (
    <DropZone disabled={isLayerLocked(layer)} empty={empty} parentId={layer.id}>
      {childNodes}
    </DropZone>
  );
}

function BlockContentInner({
  layer,
  registry,
  editing,
  insideWidget,
  tableRowDrop,
}: {
  layer: Layer;
  registry: BlockRegistry;
  editing: boolean;
  insideWidget: boolean;
  tableRowDrop?: {
    className: string;
    setNodeRef: (node: HTMLElement | null) => void;
  };
}) {
  const { onSelect, onStartEdit, onCommitEdit, resolveAssetUrl, scene } =
    useBlockEditor();
  const chromeHost = useBlockChromeHostProps();
  const config = registry.get(layer.type);
  const textBlock = isRichTextBlock(registry, layer.type);
  const editable = canEditLayerData(layer);
  const acceptsChildren = config?.acceptsChildren === true;
  const data = resolveImageFieldsInData(
    layerDataRecord(layer),
    resolveAssetUrl,
    config?.fields
  );
  const slotNodes = buildSlotNodes(layer, registry);
  const toolbar = resolveRichTextToolbar(layer, scene, registry);

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
        <Suspense fallback={config.render({ data })}>
          {config.render({
            data,
            children: (
              <HtmlRichTextEditorLazy
                align={
                  toolbar.align ? parseRichTextAlign(data.align) : undefined
                }
                html={String(data.html ?? '')}
                onCommit={handleCommit}
                toolbar={toolbar}
              />
            ),
          })}
        </Suspense>
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
    containerRef: tableRowDrop?.setNodeRef,
    containerClassName: tableRowDrop?.className,
    hostProps: chromeHost ?? undefined,
  });
}

function TableRowContainerBlockContent({
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
  const { sortDraft } = useBlockEditor();
  const blockChildren = getBlockChildren(layer);
  const { empty } = childListInsertChrome(layer.id, blockChildren, sortDraft);
  const tableRowDrop = useTableRowChildListDropTarget(layer.id, layer, empty);
  return (
    <BlockContentInner
      editing={editing}
      insideWidget={insideWidget}
      layer={layer}
      registry={registry}
      tableRowDrop={tableRowDrop}
    />
  );
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
  const config = registry.get(layer.type);
  const acceptsChildren = config?.acceptsChildren === true;
  const childContainerHost = config?.childContainerHost ?? 'default';
  const tableRowChildHost =
    acceptsChildren && childContainerHost === 'table-row';

  if (tableRowChildHost) {
    return (
      <TableRowContainerBlockContent
        editing={editing}
        insideWidget={insideWidget}
        layer={layer}
        registry={registry}
      />
    );
  }

  return (
    <BlockContentInner
      editing={editing}
      insideWidget={insideWidget}
      layer={layer}
      registry={registry}
    />
  );
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
  const imageFieldKey = primaryImageFieldKey(config?.fields);
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
      chromeDisplay={config.chromeDisplay ?? 'block'}
      dragDisabled={dragDisabled}
      dropContainerPreview={dropContainerPreview}
      editing={editing}
      imageFieldKey={imageFieldKey}
      insertLineAfter={insertLineAfter}
      insertLineBefore={insertLineBefore}
      insertLineVertical={insertLineVertical}
      insideWidget={nodeInsideWidget}
      isDraggingGhost={isDraggingGhost}
      label={config.label}
      layer={layer}
      selected={selected}
      setNodeRef={setNodeRef}
      dragHandleProps={
        dragDisabled
          ? undefined
          : ({
              ...listeners,
              ...attributes,
            } as HTMLAttributes<HTMLButtonElement>)
      }
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

/**
 * Page root has no BlockChrome (no outline / selection pill).
 * Select it by clicking the artboard; nested blocks still use BlockChrome.
 * See docs/architecture/html-editor-surfaces.md.
 */
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
    hoveredLayerId = null,
    editingTarget,
    sortDraft,
    canReplaceImage = false,
    onSelect,
    onHoverLayer,
    onStartEdit,
    onCommitEdit,
    onDuplicate,
    onRemove,
    onReplaceImage,
    resolveAssetUrl,
  }: {
    layers: readonly Layer[];
    registry: BlockRegistry;
    scene: Scene;
    selectedId: string | null;
    hoveredLayerId?: string | null;
    editingTarget: BlockEditTarget | null;
    sortDraft: BlockSortDraft | null;
    canReplaceImage?: boolean;
    onSelect: (id: string) => void;
    onHoverLayer?: (id: string | null) => void;
    onStartEdit: (hostId: string, dataPath: string) => void;
    onCommitEdit: (
      hostId: string,
      dataPath: string,
      html: string,
      align?: RichTextAlign
    ) => void;
    onDuplicate: (id: string) => void;
    onRemove: (id: string) => void;
    onReplaceImage?: (
      layerId: string,
      fieldPath: string,
      file: File
    ) => void | Promise<void>;
    resolveAssetUrl?: (ref: string) => string;
  }) => {
    const [imageOverride, setImageOverride] = useState<BlockImageTarget | null>(
      null
    );

    useEffect(() => {
      setImageOverride((prev) =>
        prev && prev.layerId !== selectedId ? null : prev
      );
    }, [selectedId]);

    return (
      <BlockEditorProvider
        value={{
          scene,
          selectedId,
          hoveredLayerId,
          editingTarget,
          sortDraft,
          canReplaceImage,
          imageOverride,
          setImageOverride,
          onSelect,
          onHoverLayer: onHoverLayer ?? (() => {}),
          onStartEdit,
          onCommitEdit,
          onDuplicate,
          onRemove,
          onReplaceImage: onReplaceImage ?? (() => {}),
          resolveAssetUrl: resolveAssetUrl ?? ((ref) => ref),
        }}
      >
        {layers.map((layer) => (
          <RootBlockNode key={layer.id} layer={layer} registry={registry} />
        ))}
      </BlockEditorProvider>
    );
  }
);
