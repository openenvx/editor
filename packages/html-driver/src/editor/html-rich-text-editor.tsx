import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/studio/react';
import {
  useVariableChipLabels,
  useVariableRichTextSuggest,
  VariableSuggestMenu,
} from '@openenvx/variables';
import { isRichTextBlurInsideVariableChrome } from '@openenvx/variables/tiptap';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
import {
  readRichTextBoundaryFromKey,
  type RichTextBoundary,
  type RichTextCaret,
} from './rich-text-boundary';
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
  /** Block-level align (`data.align`) - seeded into TipTap and written back on commit. */
  align?: RichTextAlign;
  /** Bubble-menu sections; defaults show block type + align. */
  toolbar?: ResolvedRichTextToolbar;
  /** Caret placement on mount. Omit to keep click-to-edit select-all. */
  caret?: RichTextCaret;
  onCommit: (html: string, align?: RichTextAlign) => void;
  /**
   * Caret-at-boundary intents (Enter / Backspace / arrows). Return true when
   * the pane handled the key so ProseMirror should not.
   */
  onBoundary?: (intent: RichTextBoundary) => boolean;
  /** Register inline insert handler while this editor is mounted. */
  bindTextInsert?: (insert: ((text: string) => void) | null) => void;
}

function readEditorDom(editor: Editor): HTMLElement | null {
  try {
    return editor.view.dom;
  } catch {
    return null;
  }
}

export function HtmlRichTextEditor({
  html,
  align,
  toolbar = DEFAULT_TOOLBAR,
  caret,
  onCommit,
  onBoundary,
  bindTextInsert,
}: HtmlRichTextEditorProps) {
  const { executeCommand } = useWorkbenchContext();
  const sceneVariables =
    useWorkbenchContextSelector((state) => state.scene?.variables) ?? [];
  const { missingTip, pickerTitle, createVariable } = useVariableChipLabels();
  const syncAlign = align !== undefined && toolbar.align;
  const menuRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<Editor | null>(null);
  const onBoundaryRef = useRef(onBoundary);
  onBoundaryRef.current = onBoundary;
  const {
    catalogRef,
    createMenuProps,
    handleSuggestKeyDown,
    resetSuggestDismissed,
    suggestRef,
    syncSuggestFromEditor,
  } = useVariableRichTextSuggest({
    createVariable,
    executeCommand,
    missingTip,
    pickerTitle,
    sceneVariables,
  });
  const [placement, setPlacement] = useState<FloatingPillPlacement | null>(
    null
  );

  const editor = useEditor({
    autofocus: false,
    content: html,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (
          handleSuggestKeyDown(event, editorRef, {
            stopPropagationOnSuggestEscape: true,
          })
        ) {
          return true;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onCommit(
            normalizeCommittedRichTextHtml(view.dom.innerHTML || html),
            syncAlign ? textAlignFromProseMirrorDom(view.dom) : undefined
          );
          return true;
        }

        const activeEditor = editorRef.current;
        const handleBoundary = onBoundaryRef.current;
        if (activeEditor && handleBoundary) {
          const intent = readRichTextBoundaryFromKey(activeEditor, event);
          if (intent && handleBoundary(intent)) {
            event.preventDefault();
            return true;
          }
        }

        return false;
      },
    },
    extensions: createRichTextEditorExtensions(
      toolbar,
      () => catalogRef.current
    ),
    onBlur: ({ editor: activeEditor, event }) => {
      if (isRichTextBlurInsideVariableChrome(event.relatedTarget)) {
        return;
      }
      onCommit(
        normalizeCommittedRichTextHtml(activeEditor.getHTML()),
        syncAlign ? readEditorTextAlign(activeEditor) : undefined
      );
    },
    onCreate: ({ editor: activeEditor }) => {
      const chain = activeEditor.chain();
      if (caret === 'start' || caret === 'end') {
        chain.focus(caret, { scrollIntoView: false });
      } else {
        chain.selectAll().focus(undefined, { scrollIntoView: false });
      }
      const seed = syncAlign ? parseRichTextAlign(align) : null;
      if (seed) {
        chain.setTextAlign(seed);
      }
      chain.run();
    },
    onTransaction: ({ editor: activeEditor }) => {
      syncSuggestFromEditor(activeEditor);
    },
  });

  editorRef.current = editor;

  useLayoutEffect(() => {
    if (!bindTextInsert || !editor) {
      return;
    }
    const insert = (text: string) => {
      resetSuggestDismissed();
      editor.chain().focus().insertContent(text).run();
    };
    bindTextInsert(insert);
    return () => bindTextInsert(null);
  }, [bindTextInsert, editor, resetSuggestDismissed]);

  useEffect(() => {
    if (!editor) {
      return;
    }
    syncSuggestFromEditor(editor);
  }, [editor, syncSuggestFromEditor]);

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
      if (suggestRef.current) {
        syncSuggestFromEditor(editor);
      }
    };

    const editorDom = readEditorDom(editor);
    if (!editorDom) {
      setPlacement(null);
      return;
    }

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
    ro?.observe(editorDom);
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
  }, [editor, selectionEpoch, suggestRef, syncSuggestFromEditor]);

  if (!editor) {
    return null;
  }

  const menuProps = createMenuProps(editor);

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
              data-openenvx-rich-text-bubble=""
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
      {menuProps
        ? createPortal(<VariableSuggestMenu {...menuProps} />, document.body)
        : null}
      <EditorContent editor={editor} />
    </div>
  );
}
