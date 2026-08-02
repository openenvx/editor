import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  HtmlRichTextEditor,
  shouldShowRichTextBubbleMenu,
} from './html-rich-text-editor';

afterEach(cleanup);

describe('shouldShowRichTextBubbleMenu', () => {
  it('hides for empty caret and shows for any non-empty selection', () => {
    const emptyState = {
      selection: { from: 1, to: 1, empty: true },
      doc: {
        content: { size: 10 },
        textBetween: () => '',
      },
    };
    expect(
      shouldShowRichTextBubbleMenu({
        editor: {} as never,
        state: emptyState as never,
      })
    ).toBe(false);

    const fullState = {
      selection: { from: 0, to: 5, empty: false },
      doc: {
        content: { size: 5 },
        textBetween: () => 'Hello',
      },
    };
    expect(
      shouldShowRichTextBubbleMenu({
        editor: {} as never,
        state: fullState as never,
      })
    ).toBe(true);

    const partialState = {
      selection: { from: 0, to: 2, empty: false },
      doc: {
        content: { size: 5 },
        textBetween: (from: number, to: number) =>
          from === 0 && to === 2 ? 'He' : 'Hello',
      },
    };
    expect(
      shouldShowRichTextBubbleMenu({
        editor: {} as never,
        state: partialState as never,
      })
    ).toBe(true);
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
