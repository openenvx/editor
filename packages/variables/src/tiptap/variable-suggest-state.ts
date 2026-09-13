import {
  formatVariableToken,
  type TemplateVariable,
} from '@openenvx/core/schema';
import type { Editor } from '@tiptap/react';

export interface VariableSuggestAnchor {
  filter: string;
  from: number;
  to: number;
  top: number;
  left: number;
}

const SUGGEST_TRIGGER_RE = /(?<!\{)\{\{([A-Za-z0-9_]*)$/;

export function detectVariableSuggest(
  editor: Editor
): VariableSuggestAnchor | null {
  const { from, empty } = editor.state.selection;
  if (!empty) {
    return null;
  }
  const textBefore = editor.state.doc.textBetween(
    Math.max(0, from - 64),
    from,
    '\n'
  );
  const match = textBefore.match(SUGGEST_TRIGGER_RE);
  if (!match) {
    return null;
  }
  const filter = match[1] ?? '';
  const triggerFrom = from - match[0].length;
  const coords = editor.view.coordsAtPos(from);
  return {
    filter,
    from: triggerFrom,
    to: from,
    top: coords.bottom + 4,
    left: coords.left,
  };
}

export function filterVariableSuggestions(
  variables: TemplateVariable[],
  filter: string
): TemplateVariable[] {
  if (!filter) {
    return variables;
  }
  const lower = filter.toLowerCase();
  return variables.filter((entry) => entry.key.toLowerCase().startsWith(lower));
}

export function insertVariableTokenAtSuggest(
  editor: Editor,
  anchor: VariableSuggestAnchor,
  key: string
): void {
  editor
    .chain()
    .focus()
    .deleteRange({ from: anchor.from, to: anchor.to })
    .insertContent(formatVariableToken(key))
    .run();
}

/** Blur targets that should not commit the rich-text editor. */
export function isRichTextBlurInsideVariableChrome(
  related: EventTarget | null
): boolean {
  if (!(related instanceof Element)) {
    return false;
  }
  return Boolean(
    related.closest('[data-openenvx-rich-text-bubble]') ||
    related.closest('[data-openenvx-variable-suggest]') ||
    related.closest('[data-openenvx-variable-dialog]')
  );
}
