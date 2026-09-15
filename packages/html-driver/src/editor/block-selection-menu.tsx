import { Copy, GripVertical, ImageIcon, Trash2 } from 'lucide-react';
import {
  memo,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type HTMLAttributes,
  type PointerEvent,
} from 'react';
import { createPortal } from 'react-dom';

import {
  placeFloatingPill,
  readFloatingPillObstacles,
  rectToBox,
  viewportBox,
  type FloatingPillPlacement,
} from './floating-pill';

import styles from './html-editor-pane.module.css';

/** Outline pad from `.blockWrap` chrome vars (offset + width). */
const OUTLINE_PAD_PX = 3;

/** Fallback before the portaled menu has a measurable box. */
const MENU_SIZE_FALLBACK = { width: 200, height: 40 };

function stopMenuEvent(event: PointerEvent) {
  event.stopPropagation();
}

/** Portaled menus sit on `document.body` - copy shell theme for `--wb-*`. */
function readDocumentTheme(): string {
  const scoped = document.querySelector('[data-owb-theme]');
  return scoped instanceof HTMLElement
    ? (scoped.dataset.owbTheme ?? 'light')
    : 'light';
}

function subscribeDocumentTheme(onStoreChange: () => void): () => void {
  const observer = new MutationObserver(onStoreChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-owb-theme'],
    subtree: true,
  });
  return () => observer.disconnect();
}

function resolvePlacement(
  anchor: HTMLElement,
  menu: HTMLElement | null
): FloatingPillPlacement {
  const width = menu?.offsetWidth || MENU_SIZE_FALLBACK.width;
  const height = menu?.offsetHeight || MENU_SIZE_FALLBACK.height;
  return placeFloatingPill({
    anchor: rectToBox(anchor.getBoundingClientRect()),
    pillWidth: width,
    pillHeight: height,
    viewport: viewportBox(),
    obstacles: readFloatingPillObstacles(),
    outlinePad: OUTLINE_PAD_PX,
  });
}

export const BlockSelectionMenu = memo(
  ({
    label,
    anchor,
    canDrag = false,
    canDuplicate,
    canRemove,
    canReplaceImage = false,
    dragHandleProps,
    onDuplicate,
    onRemove,
    onReplaceImage,
  }: {
    label: string;
    /** Block chrome element the pill anchors to (top-right, floating). */
    anchor: HTMLElement | null;
    canDrag?: boolean;
    canDuplicate: boolean;
    canRemove: boolean;
    canReplaceImage?: boolean;
    dragHandleProps?: HTMLAttributes<HTMLButtonElement>;
    onDuplicate: () => void;
    onRemove: () => void;
    onReplaceImage?: (file: File) => void;
  }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const showActions = canDrag || canDuplicate || canRemove || canReplaceImage;
    const theme = useSyncExternalStore(
      subscribeDocumentTheme,
      readDocumentTheme,
      () => 'light'
    );
    const [placement, setPlacement] = useState<FloatingPillPlacement | null>(
      null
    );

    useLayoutEffect(() => {
      if (!anchor) {
        setPlacement(null);
        return;
      }

      const updatePosition = () => {
        setPlacement(resolvePlacement(anchor, menuRef.current));
      };

      updatePosition();

      const onScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);
      const ro =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(onScrollOrResize)
          : null;
      ro?.observe(anchor);

      const raf = requestAnimationFrame(() => {
        const menu = menuRef.current;
        if (menu) {
          ro?.observe(menu);
        }
        updatePosition();
      });

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
        ro?.disconnect();
      };
    }, [anchor]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (file && onReplaceImage) {
        onReplaceImage(file);
      }
    };

    if (!(placement && placement.kind === 'placed' && anchor)) {
      return null;
    }

    return createPortal(
      <div
        ref={menuRef}
        aria-label={`${label} actions`}
        className={styles.selectionMenu}
        data-owb-theme={theme}
        role="toolbar"
        style={{
          top: placement.top,
          left: placement.left,
        }}
        onPointerDown={stopMenuEvent}
      >
        {canDrag ? (
          <button
            type="button"
            {...dragHandleProps}
            aria-label="Move"
            className={`${styles.selectionMenuButton} ${styles.selectionMenuDragHandle}`}
          >
            <GripVertical size={14} strokeWidth={1.75} />
          </button>
        ) : null}
        <span className={styles.selectionMenuLabel}>{label}</span>
        {showActions && (canDuplicate || canRemove || canReplaceImage) ? (
          <span aria-hidden className={styles.selectionMenuDivider} />
        ) : null}
        {canReplaceImage ? (
          <>
            <button
              aria-label="Replace image"
              className={styles.selectionMenuButton}
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={14} strokeWidth={1.75} />
            </button>
            <input
              ref={fileInputRef}
              accept="image/*"
              className={styles.selectionMenuFileInput}
              type="file"
              onChange={handleFileChange}
            />
          </>
        ) : null}
        {canDuplicate ? (
          <button
            aria-label="Duplicate"
            className={styles.selectionMenuButton}
            type="button"
            onClick={onDuplicate}
          >
            <Copy size={14} strokeWidth={1.75} />
          </button>
        ) : null}
        {canRemove ? (
          <button
            aria-label="Delete"
            className={styles.selectionMenuButton}
            type="button"
            onClick={onRemove}
          >
            <Trash2 size={14} strokeWidth={1.75} />
          </button>
        ) : null}
      </div>,
      document.body
    );
  }
);
