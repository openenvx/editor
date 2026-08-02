import { Color } from '@tiptap/extension-color';
import { FontFamily } from '@tiptap/extension-font-family';
import { TextAlign } from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { StarterKit } from '@tiptap/starter-kit';

export function createRichTextEditorExtensions() {
  return [
    StarterKit.configure({
      // Headings stay as block-layer types (html.heading / email.heading), not
      // nested TipTap heading nodes inside the outer heading tag.
      heading: false,
      horizontalRule: false,
      link: { openOnClick: false },
    }),
    TextStyle,
    Color,
    FontFamily,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
  ];
}
