import { TextSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';

import { normalizeCommittedRichTextHtml } from './normalize-committed-rich-text-html';

export type RichTextCaret = 'start' | 'end';

export type RichTextBoundary =
  | { kind: 'insertAfter'; html: string }
  | { kind: 'deleteEmpty' }
  | { kind: 'focusPrev'; html: string }
  | { kind: 'focusNext'; html: string };

export function isDocEmpty(editor: Editor): boolean {
  return editor.isEmpty;
}

export function isCaretAtDocStart(editor: Editor): boolean {
  const { empty, from } = editor.state.selection;
  if (!empty) {
    return false;
  }
  return from === TextSelection.atStart(editor.state.doc).from;
}

export function isCaretAtDocEnd(editor: Editor): boolean {
  const { empty, from } = editor.state.selection;
  if (!empty) {
    return false;
  }
  return from === TextSelection.atEnd(editor.state.doc).from;
}

/** Top-level paragraph only - lists / quotes / code keep their Enter meaning. */
export function isPlainParagraphContext(editor: Editor): boolean {
  const { $from } = editor.state.selection;
  return $from.depth === 1 && $from.parent.type.name === 'paragraph';
}

function committedHtml(editor: Editor): string {
  return normalizeCommittedRichTextHtml(editor.getHTML());
}

export function readRichTextBoundaryFromKey(
  editor: Editor,
  event: {
    key: string;
    shiftKey: boolean;
    altKey: boolean;
    metaKey: boolean;
    ctrlKey: boolean;
  }
): RichTextBoundary | null {
  if (event.altKey || event.metaKey || event.ctrlKey) {
    return null;
  }
  if (event.key === 'Enter') {
    if (event.shiftKey) {
      return null;
    }
    if (isPlainParagraphContext(editor) && isCaretAtDocEnd(editor)) {
      return { kind: 'insertAfter', html: committedHtml(editor) };
    }
    return null;
  }
  if (event.key === 'Backspace') {
    if (event.shiftKey) {
      return null;
    }
    if (isDocEmpty(editor)) {
      return { kind: 'deleteEmpty' };
    }
    return null;
  }
  if (event.key === 'ArrowUp') {
    if (event.shiftKey) {
      return null;
    }
    if (isCaretAtDocStart(editor)) {
      return { kind: 'focusPrev', html: committedHtml(editor) };
    }
    return null;
  }
  if (event.key === 'ArrowDown') {
    if (event.shiftKey) {
      return null;
    }
    if (isCaretAtDocEnd(editor)) {
      return { kind: 'focusNext', html: committedHtml(editor) };
    }
    return null;
  }
  return null;
}
