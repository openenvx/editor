import type { Editor } from '@tiptap/react';

export type RichTextAlign = 'left' | 'center' | 'right';

export function parseRichTextAlign(value: unknown): RichTextAlign | undefined {
  if (value === 'left' || value === 'center' || value === 'right') {
    return value;
  }
  return undefined;
}

/** `html` → `align`; `slots.headline.0.data.html` → `slots.headline.0.data.align`. */
export function alignDataPathFromHtmlPath(htmlPath: string): string {
  if (htmlPath === 'html') {
    return 'align';
  }
  if (htmlPath.endsWith('.html')) {
    return `${htmlPath.slice(0, -'.html'.length)}.align`;
  }
  return 'align';
}

export function readEditorTextAlign(editor: Editor): RichTextAlign {
  if (editor.isActive({ textAlign: 'center' })) {
    return 'center';
  }
  if (editor.isActive({ textAlign: 'right' })) {
    return 'right';
  }
  return 'left';
}
