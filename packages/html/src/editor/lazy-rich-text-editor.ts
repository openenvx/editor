import { lazy } from 'react';

/**
 * TipTap/ProseMirror is roughly a third of the editor bundle and is unused
 * until a block enters edit mode, so it loads as its own chunk on first edit.
 * Call sites wrap it in `Suspense` with the block's static render as fallback.
 */
export const HtmlRichTextEditorLazy = lazy(async () => {
  const module = await import('./html-rich-text-editor');
  return { default: module.HtmlRichTextEditor };
});
