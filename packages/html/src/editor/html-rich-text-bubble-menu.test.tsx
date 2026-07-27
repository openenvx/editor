import type { Editor } from '@tiptap/react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HtmlRichTextBubbleMenuToolbar } from './html-rich-text-bubble-menu';

afterEach(cleanup);

function mockEditor(active: Partial<Record<string, boolean>> = {}): Editor {
  const run = vi.fn();
  const chain = {
    focus: () => chain,
    toggleBold: () => chain,
    toggleItalic: () => chain,
    toggleUnderline: () => chain,
    toggleStrike: () => chain,
    run,
  };
  return {
    isActive: (name: string) => active[name] === true,
    chain: () => chain,
  } as unknown as Editor;
}

describe('HtmlRichTextBubbleMenuToolbar', () => {
  it('toggles formatting commands', () => {
    const editor = mockEditor({ bold: true });
    render(<HtmlRichTextBubbleMenuToolbar editor={editor} />);

    for (const name of ['Bold', 'Italic', 'Underline', 'Strikethrough']) {
      fireEvent.mouseDown(screen.getByRole('button', { name }));
    }

    expect(editor.chain().run).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Bold' }).className).toContain(
      'formatButtonActive'
    );
  });
});
