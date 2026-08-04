import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  isMostlyVisible,
  placeFloatingPill,
  readFloatingPillObstacles,
  selectionBoxFromCoords,
  viewportBox,
  type FloatingPillPlacement,
} from './floating-pill';
import { HtmlRichTextBubbleMenuToolbar } from './html-rich-text-bubble-menu';
import { normalizeCommittedRichTextHtml } from './normalize-committed-rich-text-html';
import {
  parseRichTextAlign,
  readEditorTextAlign,
  type RichTextAlign,
} from './rich-text-align';
import { createRichTextEditorExtensions } from './rich-text-editor-extensions';
import type { ResolvedRichTextToolbar } from './rich-text-toolbar';

import styles from './html-editor-pane.module.css';

const MENU_SIZE_FALLBACK = { width: 320, height: 40 };
const DEFAULT_TOOLBAR: ResolvedRichTextToolbar = {
  blockType: true,
  link: true,
  code: true,
  align: true,
};

/** True when the current selection has text and is mostly on-screen. */
export function shouldShowRichTextBubbleMenu(editor: Editor): boolean {
  const { state, view } = editor;
  const { from, to, empty } = state.selection;
  if (empty) {
    return false;
  }
  if (state.doc.textBetween(from, to, '\n').length === 0) {
    return false;
  }
  const selection = selectionBoxFromCoords(
    view.coordsAtPos(from),
    view.coordsAtPos(to)
  );
  return isMostlyVisible(selection, viewportBox());
}

function placeRichTextBubble(
  editor: Editor,
  menu: HTMLElement | null
): FloatingPillPlacement {
  if (!shouldShowRichTextBubbleMenu(editor)) {
    return { kind: 'hidden', reason: 'anchor-obscured' };
  }
  const { from, to } = editor.state.selection;
  const anchor = selectionBoxFromCoords(
    editor.view.coordsAtPos(from),
    editor.view.coordsAtPos(to)
  );
  return placeFloatingPill({
    anchor,
    align: 'top-center',
    pillWidth: menu?.offsetWidth || MENU_SIZE_FALLBACK.width,
    pillHeight: menu?.offsetHeight || MENU_SIZE_FALLBACK.height,
    viewport: viewportBox(),
    obstacles: readFloatingPillObstacles(),
    outlinePad: 0,
  });
}

function textAlignFromProseMirrorDom(dom: HTMLElement): RichTextAlign {
  const block = dom.querySelector<HTMLElement>('p, h1, h2, h3, h4') ?? dom;
  return parseRichTextAlign(block.style.textAlign) ?? 'left';
}

export interface HtmlRichTextEditorProps {
  html: string;
  /** Block-level align (`data.align`) — seeded into TipTap and written back on commit. */
  align?: RichTextAlign;
  /** Bubble-menu sections; defaults show block type + align. */
  toolbar?: ResolvedRichTextToolbar;
  onCommit: (html: string, align?: RichTextAlign) => void;
}

export function HtmlRichTextEditor({
  html,
  align,
  toolbar = DEFAULT_TOOLBAR,
  onCommit,
}: HtmlRichTextEditorProps) {
  const syncAlign = align !== undefined && toolbar.align;
  const menuRef = useRef<HTMLDivElement>(null);
  const [placement, setPlacement] = useState<FloatingPillPlacement | null>(
    null
  );

  const editor = useEditor({
    autofocus: false,
    content: html,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key !== 'Escape') {
          return false;
        }
        event.preventDefault();
        event.stopPropagation();
        onCommit(
          normalizeCommittedRichTextHtml(view.dom.innerHTML || html),
          syncAlign ? textAlignFromProseMirrorDom(view.dom) : undefined
        );
        return true;
      },
    },
    extensions: createRichTextEditorExtensions(toolbar),
    onBlur: ({ editor: activeEditor, event }) => {
      const related = event.relatedTarget;
      if (
        related instanceof Node &&
        related instanceof Element &&
        related.closest('[data-openenvx-rich-text-bubble]')
      ) {
        return;
      }
      onCommit(
        normalizeCommittedRichTextHtml(activeEditor.getHTML()),
        syncAlign ? readEditorTextAlign(activeEditor) : undefined
      );
    },
    onCreate: ({ editor: activeEditor }) => {
      const chain = activeEditor
        .chain()
        .selectAll()
        .focus(undefined, { scrollIntoView: false });
      const seed = syncAlign ? parseRichTextAlign(align) : null;
      if (seed) {
        chain.setTextAlign(seed);
      }
      chain.run();
    },
  });

  // Re-run placement when the selection/doc changes.
  const selectionEpoch = useEditorState({
    editor,
    selector: ({ editor: active }) =>
      active
        ? `${active.state.selection.from}:${active.state.selection.to}:${active.state.doc.content.size}`
        : '',
  });

  useLayoutEffect(() => {
    if (!editor) {
      setPlacement(null);
      return;
    }

    const updatePosition = () => {
      setPlacement(placeRichTextBubble(editor, menuRef.current));
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
    ro?.observe(editor.view.dom);
    const menu = menuRef.current;
    if (menu) {
      ro?.observe(menu);
    }

    const raf = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
      ro?.disconnect();
    };
  }, [editor, selectionEpoch]);

  if (!editor) {
    return null;
  }

  return (
    <div
      className={styles.editorHost}
      style={align ? { textAlign: align } : undefined}
    >
      {placement?.kind === 'placed'
        ? createPortal(
            <div
              ref={menuRef}
              className={styles.bubbleMenuPortal}
              data-align={placement.align}
              style={{ top: placement.top, left: placement.left }}
            >
              <HtmlRichTextBubbleMenuToolbar
                editor={editor}
                toolbar={toolbar}
              />
            </div>,
            document.body
          )
        : null}
      <EditorContent editor={editor} />
    </div>
  );
}
