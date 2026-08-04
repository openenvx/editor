import type { Editor } from '@tiptap/react';
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HtmlRichTextEditor,
  shouldShowRichTextBubbleMenu,
} from './html-rich-text-editor';

afterEach(cleanup);

function mockEditor(args: {
  empty?: boolean;
  text?: string;
  from?: number;
  to?: number;
  coords?: { top: number; bottom: number; left: number; right: number };
}): Editor {
  const from = args.from ?? 0;
  const to = args.to ?? 5;
  const coords = args.coords ?? {
    top: 100,
    bottom: 120,
    left: 40,
    right: 120,
  };
  return {
    state: {
      selection: { from, to, empty: args.empty ?? false },
      doc: {
        textBetween: () => args.text ?? (args.empty ? '' : 'Hello'),
      },
    },
    view: {
      coordsAtPos: () => coords,
    },
  } as never;
}

describe('shouldShowRichTextBubbleMenu', () => {
  it('hides for empty caret and shows for an on-screen selection', () => {
    expect(
      shouldShowRichTextBubbleMenu(mockEditor({ empty: true, text: '' }))
    ).toBe(false);
    expect(shouldShowRichTextBubbleMenu(mockEditor({}))).toBe(true);
  });

  it('hides when the selection is mostly scrolled off-screen', () => {
    expect(
      shouldShowRichTextBubbleMenu(
        mockEditor({
          coords: { top: -80, bottom: -20, left: 40, right: 120 },
        })
      )
    ).toBe(false);
  });
});

describe('HtmlRichTextEditor', () => {
  it('commits HTML on blur', async () => {
    const onCommit = vi.fn();
    render(<HtmlRichTextEditor html="<p>Hello</p>" onCommit={onCommit} />);

    await waitFor(() => {
      expect(
        document.querySelector('.ProseMirror, [contenteditable="true"]')
      ).toBeTruthy();
    });

    const editable = document.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    fireEvent.blur(editable);

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalled();
    });
  });

  it('commits on Escape', async () => {
    const onCommit = vi.fn();
    render(<HtmlRichTextEditor html="<p>Hello</p>" onCommit={onCommit} />);

    await waitFor(() => {
      expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
    });

    const editable = document.querySelector(
      '[contenteditable="true"]'
    ) as HTMLElement;
    fireEvent.keyDown(editable, { key: 'Escape' });

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalled();
    });
  });

  it('seeds block align into TipTap and commits it back', async () => {
    const onCommit = vi.fn();
    render(
      <HtmlRichTextEditor
        align="center"
        html="Our new article"
        onCommit={onCommit}
      />
    );

    const editable = await waitFor(() => {
      const node = document.querySelector('[contenteditable="true"]');
      expect(node).toBeTruthy();
      return node as HTMLElement;
    });

    await waitFor(() => {
      const centered = editable.querySelector('[style*="text-align"]');
      expect(centered).toBeTruthy();
      expect((centered as HTMLElement).style.textAlign).toBe('center');
    });

    fireEvent.blur(editable);

    await waitFor(() => {
      expect(onCommit).toHaveBeenCalled();
      const [, align] = onCommit.mock.calls.at(-1)!;
      expect(align).toBe('center');
    });
  });
});
