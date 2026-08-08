import { isTypingTarget } from '@openenvx/headless';
import type { Layer } from '@xmazu/openenvxee-schema';
import {
  useCallback,
  useState,
  type DragEvent,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from 'react';

import { BlockChromeHostProvider } from './block-chrome-host-context';
import { useBlockEditor } from './block-editor-context';
import { BlockSelectionMenu } from './block-selection-menu';
import { emitOpenEnvxHtmlWidgetClick } from './html-widget-click-handler';
import { dataTransferHasFiles, firstImageFile } from './image-file-drop';

import styles from './html-editor-pane.module.css';

export function BlockChrome({
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
  imageFieldKey,
  insideWidget = false,
  chromeDisplay = 'block',
  setNodeRef,
  sortableProps,
  dragHandleProps,
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
  /** Primary image field key when this block can replace an image. */
  imageFieldKey: string | null;
  /** True when this block is under an `openenvx.widget` ancestor (or is one). */
  insideWidget?: boolean;
  chromeDisplay?: 'block' | 'inline' | 'contents';
  setNodeRef?: (node: HTMLElement | null) => void;
  /** dnd-kit listeners/attributes on the block wrap (full-chrome drag). */
  sortableProps?: Record<string, unknown>;
  /** Same listeners on the selection-menu grip (extra affordance). */
  dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
  children: ReactNode;
}) {
  const {
    onSelect,
    onDuplicate,
    onRemove,
    onReplaceImage,
    canReplaceImage,
    imageOverride,
    setImageOverride,
    hoveredLayerId,
    onHoverLayer,
    sortDraft,
  } = useBlockEditor();
  const activeReplacePath =
    selected && imageOverride?.layerId === layer.id
      ? imageOverride.fieldPath
      : selected
        ? imageFieldKey
        : null;
  const replaceEnabled = Boolean(
    selected &&
    canReplaceImage &&
    activeReplacePath &&
    chromeDisplay !== 'contents' &&
    !editing &&
    !isDraggingGhost
  );
  const hovered =
    hoveredLayerId === layer.id && !selected && sortDraft === null;
  const [imageDropActive, setImageDropActive] = useState(false);

  const activate = useCallback(() => {
    if (insideWidget) {
      emitOpenEnvxHtmlWidgetClick(layer.id);
    }
    onSelect(layer.id);
    // Host chrome click → primary image field (clear slot override).
    setImageOverride(null);
  }, [insideWidget, layer.id, onSelect, setImageOverride]);

  const handleClick = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      // React-Email Button/Link render <a href> — don't navigate / hash-scroll in the editor.
      const target = event.target;
      const el =
        target instanceof Element
          ? target
          : target instanceof Node
            ? target.parentElement
            : null;
      if (el?.closest('a[href]')) {
        event.preventDefault();
      }
      activate();
    },
    [activate]
  );

  const handleContextMenu = useCallback(
    (event: MouseEvent) => {
      event.stopPropagation();
      onSelect(layer.id);
      setImageOverride(null);
    },
    [layer.id, onSelect, setImageOverride]
  );

  const handlePointerEnter = useCallback(() => {
    onHoverLayer(layer.id);
  }, [layer.id, onHoverLayer]);

  const handlePointerLeave = useCallback(
    (event: MouseEvent) => {
      const related = event.relatedTarget;
      if (related instanceof Node && event.currentTarget.contains(related)) {
        return;
      }
      const parent =
        event.currentTarget.parentElement?.closest('[data-layer-id]');
      onHoverLayer(
        parent instanceof HTMLElement ? (parent.dataset.layerId ?? null) : null
      );
    },
    [onHoverLayer]
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

  const handleReplaceFile = useCallback(
    (file: File) => {
      if (!activeReplacePath) {
        return;
      }
      void onReplaceImage(layer.id, activeReplacePath, file);
    },
    [activeReplacePath, layer.id, onReplaceImage]
  );

  const handleDragOver = useCallback(
    (event: DragEvent) => {
      if (!(replaceEnabled && dataTransferHasFiles(event.dataTransfer.types))) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = 'copy';
      setImageDropActive(true);
    },
    [replaceEnabled]
  );

  const handleDragLeave = useCallback((event: DragEvent) => {
    const related = event.relatedTarget;
    if (related instanceof Node && event.currentTarget.contains(related)) {
      return;
    }
    setImageDropActive(false);
  }, []);

  const handleDrop = useCallback(
    (event: DragEvent) => {
      if (!replaceEnabled) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      setImageDropActive(false);
      const file = firstImageFile(event.dataTransfer);
      if (file) {
        handleReplaceFile(file);
      }
    },
    [handleReplaceFile, replaceEnabled]
  );

  // Contents chrome attaches to the block root (`<td>`) — no wrapper element.
  const bindHostRef = useCallback(
    (node: HTMLElement | null) => {
      setNodeRef?.(node);
    },
    [setNodeRef]
  );

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const bindSortableRef = useCallback(
    (node: HTMLElement | null) => {
      setMenuAnchor((prev) => (prev === node ? prev : node));
      if (!setNodeRef) {
        return;
      }
      setNodeRef(node);
    },
    [setNodeRef]
  );

  const lineClass = insertLineVertical
    ? {
        before: styles.blockWrapInsertLineBeforeVertical,
        after: styles.blockWrapInsertLineAfterVertical,
      }
    : {
        before: styles.blockWrapInsertLineBefore,
        after: styles.blockWrapInsertLineAfter,
      };

  const wrapClassName = [
    styles.blockWrap,
    chromeDisplay === 'inline' ? styles.blockWrapInline : '',
    chromeDisplay === 'contents' ? styles.blockWrapContents : '',
    selected ? styles.blockWrapSelected : '',
    hovered ? styles.blockWrapHovered : '',
    dragDisabled ? '' : styles.blockWrapDraggable,
    isDraggingGhost ? styles.blockWrapDraggingGhost : '',
    dropContainerPreview ? styles.blockWrapDropContainer : '',
    imageDropActive ? styles.blockWrapImageDrop : '',
    insertLineBefore ? lineClass.before : '',
    insertLineAfter ? lineClass.after : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapProps = {
    className: wrapClassName,
    'data-layer-id': layer.id,
    role: 'treeitem' as const,
    tabIndex: selected ? 0 : -1,
    onClick: handleClick,
    onContextMenu: handleContextMenu,
    onDragLeave: replaceEnabled ? handleDragLeave : undefined,
    onDragOver: replaceEnabled ? handleDragOver : undefined,
    onDrop: replaceEnabled ? handleDrop : undefined,
    onKeyDown: handleKeyDown,
    onPointerEnter: handlePointerEnter,
    onPointerLeave: handlePointerLeave,
    ...sortableProps,
  };

  if (chromeDisplay === 'contents') {
    return (
      <BlockChromeHostProvider
        value={{
          ...wrapProps,
          ref: bindHostRef,
        }}
      >
        {children}
      </BlockChromeHostProvider>
    );
  }

  return (
    <div {...wrapProps} ref={bindSortableRef}>
      {selected && !editing && !isDraggingGhost ? (
        <BlockSelectionMenu
          anchor={menuAnchor}
          canDrag={!dragDisabled}
          canDuplicate={canDuplicate}
          canRemove={canRemove}
          canReplaceImage={replaceEnabled}
          dragHandleProps={dragDisabled ? undefined : dragHandleProps}
          label={label}
          onDuplicate={handleDuplicate}
          onRemove={handleRemove}
          onReplaceImage={replaceEnabled ? handleReplaceFile : undefined}
        />
      ) : null}
      {children}
    </div>
  );
}
