import { defaultKeymap } from '@codemirror/commands';
import { html as htmlLanguage } from '@codemirror/lang-html';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { searchKeymap } from '@codemirror/search';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { memo, useEffect, useRef } from 'react';

import styles from './email-html-source-editor.module.css';

export interface EmailHtmlSourceEditorProps {
  sourceHtml: string;
}

function createEmailHtmlSourceExtensions() {
  return [
    lineNumbers(),
    highlightActiveLineGutter(),
    highlightActiveLine(),
    EditorState.readOnly.of(true),
    htmlLanguage(),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    EditorView.lineWrapping,
    keymap.of([...defaultKeymap, ...searchKeymap]),
  ];
}

export const EmailHtmlSourceEditor = memo(
  ({ sourceHtml }: EmailHtmlSourceEditorProps) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const viewRef = useRef<EditorView | null>(null);

    useEffect(() => {
      const parent = containerRef.current;
      if (!parent) {
        return;
      }

      const view = new EditorView({
        parent,
        state: EditorState.create({
          doc: sourceHtml,
          extensions: createEmailHtmlSourceExtensions(),
        }),
      });
      viewRef.current = view;

      return () => {
        view.destroy();
        viewRef.current = null;
      };
    }, [sourceHtml]);

    return (
      <div className={styles.root} data-testid="email-html-source">
        <div className={styles.editor} ref={containerRef} />
      </div>
    );
  }
);

EmailHtmlSourceEditor.displayName = 'EmailHtmlSourceEditor';
