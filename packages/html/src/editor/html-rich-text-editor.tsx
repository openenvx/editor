import type { EditorState } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';

import { HtmlRichTextBubbleMenuToolbar } from './html-rich-text-bubble-menu';
import { normalizeCommittedRichTextHtml } from './normalize-committed-rich-text-html';
import {
  parseRichTextAlign,
  readEditorTextAlign,
  type RichTextAlign,
} from './rich-text-align';
import { createRichTextEditorExtensions } from './rich-text-editor-extensions';

import styles from './html-editor-pane.module.css';

/** Exported for unit tests — bubble menu hides only on empty caret. */
export function shouldShowRichTextBubbleMenu({
  state,
}: {
  editor: Editor;
  state: EditorState;
}): boolean {
  const { from, to, empty } = state.selection;
  if (empty) {
    return false;
  }
  return state.doc.textBetween(from, to, '\n').length > 0;
}

function textAlignFromProseMirrorDom(dom: HTMLElement): RichTextAlign {
  const block = dom.querySelector<HTMLElement>('p, h1, h2, h3, h4') ?? dom;
  return parseRichTextAlign(block.style.textAlign) ?? 'left';
}

export interface HtmlRichTextEditorProps {
  html: string;
  /** Block-level align (`data.align`) — seeded into TipTap and written back on commit. */
  align?: RichTextAlign;
  onCommit: (html: string, align?: RichTextAlign) => void;
}

export function HtmlRichTextEditor({
  html,
  align,
  onCommit,
}: HtmlRichTextEditorProps) {
  const syncAlign = align !== undefined;
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
    extensions: createRichTextEditorExtensions(),
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
      const seed = parseRichTextAlign(align);
      if (seed) {
        chain.setTextAlign(seed);
      }
      chain.run();
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      className={styles.editorHost}
      style={align ? { textAlign: align } : undefined}
    >
      <BubbleMenu
        appendTo={() => document.body}
        editor={editor}
        options={{ placement: 'top', strategy: 'fixed' }}
        shouldShow={shouldShowRichTextBubbleMenu}
      >
        <HtmlRichTextBubbleMenuToolbar editor={editor} />
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
