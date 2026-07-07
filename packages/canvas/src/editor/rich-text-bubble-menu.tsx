import type { Editor } from '@tiptap/react';
import { Bold, Italic, Strikethrough, Underline } from 'lucide-react';
import type { ReactNode } from 'react';

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
    </div>
  );
}
