import type { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import type { ReactNode } from 'react';

import { RICH_TEXT_FONT_FAMILY_OPTIONS } from './rich-text-editor-extensions';

import styles from './canvas-editor.module.css';

function FormatButton({
  active,
  label,
  onPress,
  children,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      aria-label={label}
      className={`${styles.formatButton} ${active ? styles.formatButtonActive : ''}`}
      onMouseDown={(event) => {
        event.preventDefault();
        onPress();
      }}
      type="button"
    >
      {children}
    </button>
  );
}

export function RichTextBubbleMenuToolbar({ editor }: { editor: Editor }) {
  const textStyle =
    typeof editor.getAttributes === 'function'
      ? editor.getAttributes('textStyle')
      : {};
  const color = (textStyle.color as string | undefined) ?? '#000000';
  const fontFamily = (textStyle.fontFamily as string | undefined) ?? '';

  return (
    <div className={styles.bubbleMenu}>
      <FormatButton
        active={editor.isActive('bold')}
        label="Bold"
        onPress={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold size={14} />
      </FormatButton>
      <FormatButton
        active={editor.isActive('italic')}
        label="Italic"
        onPress={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic size={14} />
      </FormatButton>
      <FormatButton
        active={editor.isActive('underline')}
        label="Underline"
        onPress={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline size={14} />
      </FormatButton>
      <FormatButton
        active={editor.isActive('strike')}
        label="Strikethrough"
        onPress={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough size={14} />
      </FormatButton>
      <label className={styles.formatButton} title="Text color">
        <input
          aria-label="Text color"
          onChange={(event) => {
            editor.chain().focus().setColor(event.target.value).run();
          }}
          onMouseDown={(event) => event.preventDefault()}
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#000000'}
        />
      </label>
      <select
        aria-label="Font family"
        className={styles.formatButton}
        onChange={(event) => {
          const value = event.target.value;
          if (!value) {
            editor.chain().focus().unsetFontFamily().run();
            return;
          }
          editor.chain().focus().setFontFamily(value).run();
        }}
        onMouseDown={(event) => event.preventDefault()}
        value={fontFamily}
      >
        <option value="">Font</option>
        {RICH_TEXT_FONT_FAMILY_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
