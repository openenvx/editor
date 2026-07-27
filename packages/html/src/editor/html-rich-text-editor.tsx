import type { EditorState } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { StarterKit } from '@tiptap/starter-kit';

import { HtmlRichTextBubbleMenuToolbar } from './html-rich-text-bubble-menu';

import styles from './html-editor-pane.module.css';

/** Exported for unit tests — bubble menu hides on caret/full-select. */
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

  const selected = state.doc.textBetween(from, to, '\n');
  const full = state.doc.textBetween(0, state.doc.content.size, '\n');
  if (selected.length > 0 && selected === full) {
    return false;
  }

  return selected.length > 0;
}

export interface HtmlRichTextEditorProps {
  html: string;
  onCommit: (html: string) => void;
}

export function HtmlRichTextEditor({
  html,
  onCommit,
}: HtmlRichTextEditorProps) {
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
        onCommit(view.dom.innerHTML || html);
        return true;
      },
    },
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        orderedList: false,
      }),
    ],
    onBlur: ({ editor: activeEditor }) => {
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

  return (
    <div className={styles.editorHost}>
      <BubbleMenu
        editor={editor}
        options={{ placement: 'top' }}
        shouldShow={shouldShowRichTextBubbleMenu}
      >
        <HtmlRichTextBubbleMenuToolbar editor={editor} />
      </BubbleMenu>
      <EditorContent editor={editor} />
    </div>
  );
}
