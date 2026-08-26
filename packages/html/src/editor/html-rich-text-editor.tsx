import {
  useWorkbenchContext,
  useWorkbenchContextSelector,
} from '@openenvx/core/react';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
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
import { useVariableChipLabels } from './use-variable-chip-labels';
import { VariableSuggestMenu } from './variable-suggest-menu';
import {
  detectVariableSuggest,
  filterVariableSuggestions,
  insertVariableTokenAtSuggest,
  isRichTextBlurInsideVariableChrome,
  type VariableSuggestAnchor,
} from './variable-suggest-state';
import type { VariableTokenCatalog } from './variable-token-extension';

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
  onCommit,
  bindTextInsert,
}: HtmlRichTextEditorProps) {
  const { executeCommand } = useWorkbenchContext();
  const sceneVariables =
    useWorkbenchContextSelector((state) => state.scene?.variables) ?? [];
  const { missingTip, pickerTitle, createVariable } = useVariableChipLabels();
  const syncAlign = align !== undefined && toolbar.align;
  const menuRef = useRef<HTMLDivElement>(null);
  const catalogRef = useRef<VariableTokenCatalog>({
    variables: [],
    missingTip: '',
  });
  const editorRef = useRef<Editor | null>(null);
  const suggestRef = useRef<VariableSuggestAnchor | null>(null);
  const suggestDismissedRef = useRef(false);
  const highlightRef = useRef(0);
  const [placement, setPlacement] = useState<FloatingPillPlacement | null>(
    null
  );
  const [suggestAnchor, setSuggestAnchor] =
    useState<VariableSuggestAnchor | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(0);

  catalogRef.current = { variables: sceneVariables, missingTip };

  const filteredSuggestions = suggestAnchor
    ? filterVariableSuggestions(sceneVariables, suggestAnchor.filter)
    : [];

  const syncSuggestFromEditor = useCallback((activeEditor: Editor) => {
    if (suggestDismissedRef.current) {
      setSuggestAnchor(null);
      suggestRef.current = null;
      return;
    }
    const next = detectVariableSuggest(activeEditor);
    suggestRef.current = next;
    setSuggestAnchor(next);
    if (next) {
      highlightRef.current = 0;
      setHighlightIndex(0);
    }
  }, []);

  const dismissSuggest = useCallback(() => {
    suggestDismissedRef.current = true;
    suggestRef.current = null;
    setSuggestAnchor(null);
  }, []);

  const pickVariable = useCallback((activeEditor: Editor, key: string) => {
    const anchor = suggestRef.current;
    if (!anchor) {
      return;
    }
    insertVariableTokenAtSuggest(activeEditor, anchor, key);
    suggestDismissedRef.current = false;
    suggestRef.current = null;
    setSuggestAnchor(null);
  }, []);

  const editor = useEditor({
    autofocus: false,
    content: html,
    editorProps: {
      handleKeyDown: (view, event) => {
        const suggest = suggestRef.current;
        const suggestions = suggest
          ? filterVariableSuggestions(
              catalogRef.current.variables,
              suggest.filter
            )
          : [];

        if (suggest && suggestions.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            const next = (highlightRef.current + 1) % suggestions.length;
            highlightRef.current = next;
            setHighlightIndex(next);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            const next =
              (highlightRef.current - 1 + suggestions.length) %
              suggestions.length;
            highlightRef.current = next;
            setHighlightIndex(next);
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const picked = suggestions[highlightRef.current];
            const activeEditor = editorRef.current;
            if (picked && activeEditor) {
              pickVariable(activeEditor, picked.key);
            }
            return true;
          }
        }

        if (event.key === 'Escape') {
          if (suggest) {
            event.preventDefault();
            event.stopPropagation();
            dismissSuggest();
            return true;
          }
          event.preventDefault();
          event.stopPropagation();
          onCommit(
            normalizeCommittedRichTextHtml(view.dom.innerHTML || html),
            syncAlign ? textAlignFromProseMirrorDom(view.dom) : undefined
          );
          return true;
        }

        if (event.key.length === 1 && !event.metaKey && !event.ctrlKey) {
          suggestDismissedRef.current = false;
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
      suggestDismissedRef.current = false;
      editor.chain().focus().insertContent(text).run();
    };
    bindTextInsert(insert);
    return () => bindTextInsert(null);
  }, [bindTextInsert, editor]);

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
        const next = detectVariableSuggest(editor);
        if (next) {
          suggestRef.current = next;
          setSuggestAnchor(next);
        }
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
  }, [editor, selectionEpoch]);

  const handlePick = useCallback(
    (key: string) => {
      if (!editor) {
        return;
      }
      pickVariable(editor, key);
    },
    [editor, pickVariable]
  );

  const handleCreate = useCallback(() => {
    dismissSuggest();
    void executeCommand('workbench.createVariable');
  }, [dismissSuggest, executeCommand]);

  const handleEdit = useCallback(
    (id: string) => {
      dismissSuggest();
      void executeCommand('workbench.editVariable', { id });
    },
    [dismissSuggest, executeCommand]
  );

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
      {suggestAnchor
        ? createPortal(
            <VariableSuggestMenu
              anchor={suggestAnchor}
              createLabel={createVariable}
              highlightedIndex={highlightIndex}
              title={pickerTitle}
              variables={filteredSuggestions}
              onCreate={handleCreate}
              onEdit={handleEdit}
              onHighlight={(index) => {
                highlightRef.current = index;
                setHighlightIndex(index);
              }}
              onPick={handlePick}
            />,
            document.body
          )
        : null}
      <EditorContent editor={editor} />
    </div>
  );
}
