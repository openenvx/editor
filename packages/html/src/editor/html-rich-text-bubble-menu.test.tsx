import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { Editor } from '@tiptap/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HtmlRichTextBubbleMenuToolbar } from './html-rich-text-bubble-menu';

afterEach(cleanup);

function mockEditor(active: Partial<Record<string, boolean>> = {}): Editor {
  const run = vi.fn();
  const chain = {
    focus: () => chain,
    setColor: () => chain,
    setFontFamily: () => chain,
    setParagraph: () => chain,
    setTextAlign: () => chain,
    setLink: () => chain,
    unsetLink: () => chain,
    extendMarkRange: () => chain,
    toggleBold: () => chain,
    toggleItalic: () => chain,
    toggleUnderline: () => chain,
    toggleStrike: () => chain,
    toggleCode: () => chain,
    toggleBulletList: () => chain,
    toggleOrderedList: () => chain,
    toggleBlockquote: () => chain,
    toggleCodeBlock: () => chain,
    run,
  };
  return {
    getAttributes: () => ({}),
    isActive: (name: string | Record<string, string>) => {
      if (typeof name === 'string') {
        return active[name] === true;
      }
      if (name.textAlign) {
        return active[`align:${name.textAlign}`] === true;
      }
      return false;
    },
    chain: () => chain,
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Editor;
}

vi.mock('@tiptap/react', async () => {
  const actual = await vi.importActual<typeof import('@tiptap/react')>(
    '@tiptap/react'
  );
  return {
    ...actual,
    useEditorState: ({
      selector,
      editor,
    }: {
      editor: Editor;
      selector: (ctx: { editor: Editor }) => unknown;
    }) => selector({ editor }),
  };
});

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

  it('renders block type, link, and alignment controls', () => {
    render(<HtmlRichTextBubbleMenuToolbar editor={mockEditor()} />);

    expect(screen.getByRole('button', { name: 'Block type' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Link' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Align left' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Align center' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Align right' })).toBeTruthy();
  });
});
