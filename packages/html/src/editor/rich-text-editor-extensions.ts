import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';

import type { ResolvedRichTextToolbar } from './rich-text-toolbar';

const DEFAULT_TOOLBAR: ResolvedRichTextToolbar = {
  blockType: true,
  link: true,
  code: true,
  align: true,
};

export function createRichTextEditorExtensions(
  toolbar: ResolvedRichTextToolbar = DEFAULT_TOOLBAR
) {
  return [
    StarterKit.configure({
      // Headings stay as block-layer types (html.heading / email.heading), not
      // nested TipTap heading nodes inside the outer heading tag.
      heading: false,
      horizontalRule: false,
      link: toolbar.link ? { openOnClick: false } : false,
      code: toolbar.code ? undefined : false,
      ...(toolbar.blockType
        ? {}
        : {
            bulletList: false,
            orderedList: false,
            listItem: false,
            blockquote: false,
            codeBlock: false,
          }),
    }),
    TextStyle,
    Color,
    FontFamily,
    ...(toolbar.align
      ? [
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
        ]
      : []),
  ];
}
