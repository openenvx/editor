import type { EditorState } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';

import {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
} from '../rich-text-typography';
import { RichTextBubbleMenuToolbar } from './rich-text-bubble-menu';
import { createRichTextEditorExtensions } from './rich-text-editor-extensions';

import styles from './canvas-editor.module.css';

function shouldShowRichTextBubbleMenu({
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

export interface CanvasRichTextEditorProps {
  html: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  zoom: number;
  onCommit: (html: string) => void;
}

export function CanvasRichTextEditor({
  html,
  fontSize = DEFAULT_RICH_TEXT_FONT_SIZE,
  fontFamily = DEFAULT_RICH_TEXT_FONT_FAMILY,
  fill = DEFAULT_RICH_TEXT_FILL,
  align = 'left',
  lineHeight = RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
  letterSpacing = DEFAULT_RICH_TEXT_LETTER_SPACING,
  zoom,
  onCommit,
}: CanvasRichTextEditorProps) {
  const editor = useEditor({
    autofocus: false,
    content: html,
    editorProps: {
      handleKeyDown: (view, event) => {
        if (event.key !== 'Escape') {
          return false;
        }
        event.preventDefault();
        onCommit(view.dom.innerHTML || html);
        return true;
      },
    },
    extensions: createRichTextEditorExtensions(),
    onBlur: ({ editor: activeEditor, event }) => {
      const related = event.relatedTarget;
      if (
        related instanceof Element &&
        related.closest('[data-openenvx-rich-text-bubble]')
      ) {
        return;
      }
      onCommit(activeEditor.getHTML());
    },
    onCreate: ({ editor: activeEditor }) => {
      activeEditor
        .chain()
        .selectAll()
        .focus(undefined, { scrollIntoView: false })
        .run();
    },
  });

  if (!editor) {
    return null;
  }

  const scaledFontSize = fontSize * zoom;

  return (
    <div
      className={styles.editorHost}
      style={{
        color: fill,
        fontFamily,
        fontSize: scaledFontSize,
        letterSpacing: `${letterSpacing * zoom}px`,
        lineHeight,
        textAlign: align,
      }}
    >
      <BubbleMenu
        appendTo={() => document.body}
        editor={editor}
        options={{ placement: 'top', strategy: 'fixed' }}
        shouldShow={shouldShowRichTextBubbleMenu}
      >
        <RichTextBubbleMenuToolbar editor={editor} />
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
