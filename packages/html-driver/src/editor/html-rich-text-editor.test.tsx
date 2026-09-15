import type { WorkbenchApi } from '@openenvx/core';
import type { Editor } from '@tiptap/react';
import { cleanup, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createHtmlWorkbench,
  renderWithWorkbench,
} from '../test/html-editor-harness';
import {
  HtmlRichTextEditor,
  shouldShowRichTextBubbleMenu,
} from './html-rich-text-editor';

afterEach(cleanup);

let api: WorkbenchApi;
let dispose: () => void;

beforeEach(async () => {
  const harness = await createHtmlWorkbench();
  api = harness.api;
  dispose = harness.dispose;
});

afterEach(() => {
  dispose();
});

function stubGetClientRects(rects: DOMRectList, box: DOMRect): () => void {
  const targets: object[] = [Range.prototype, Element.prototype];
  if (typeof Text !== 'undefined') {
    targets.push(Text.prototype);
  }
  const originals = targets.map((target) => ({
    target,
    rects: (target as { getClientRects?: () => DOMRectList }).getClientRects,
    box: (target as { getBoundingClientRect?: () => DOMRect })
      .getBoundingClientRect,
  }));
  const htmlProto = HTMLElement.prototype as HTMLElement & {
    scrollIntoView: (arg?: unknown) => void;
  };
  const originalScroll = htmlProto.scrollIntoView;
  htmlProto.scrollIntoView = () => {};
  for (const target of targets) {
    Object.defineProperty(target, 'getClientRects', {
      configurable: true,
      value: () => rects,
    });
    Object.defineProperty(target, 'getBoundingClientRect', {
      configurable: true,
      value: () => box,
    });
  }
  return () => {
    htmlProto.scrollIntoView = originalScroll;
    for (const original of originals) {
      if (original.rects) {
        Object.defineProperty(original.target, 'getClientRects', {
          configurable: true,
          value: original.rects,
        });
      }
      if (original.box) {
        Object.defineProperty(original.target, 'getBoundingClientRect', {
          configurable: true,
          value: original.box,
        });
      }
    }
  };
}

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
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor html="<p>Hello</p>" onCommit={onCommit} />
    );

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
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor html="<p>Hello</p>" onCommit={onCommit} />
    );

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
    renderWithWorkbench(
      api,
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

  async function waitForEditable(): Promise<HTMLElement> {
    return waitFor(() => {
      const node = document.querySelector('[contenteditable="true"]');
      expect(node).toBeTruthy();
      return node as HTMLElement;
    });
  }

  it('raises insertAfter when Enter is pressed at the end of a paragraph', async () => {
    const onBoundary = vi.fn(() => true);
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor
        caret="end"
        html="<p>Hello</p>"
        onBoundary={onBoundary}
        onCommit={vi.fn()}
      />
    );

    const editable = await waitForEditable();
    fireEvent.keyDown(editable, { key: 'Enter' });

    await waitFor(() => {
      expect(onBoundary).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'insertAfter' })
      );
    });
  });

  it('does not raise insertAfter on Shift+Enter', async () => {
    const onBoundary = vi.fn(() => true);
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor
        caret="end"
        html="<p>Hello</p>"
        onBoundary={onBoundary}
        onCommit={vi.fn()}
      />
    );

    const editable = await waitForEditable();
    fireEvent.keyDown(editable, { key: 'Enter', shiftKey: true });

    expect(onBoundary).not.toHaveBeenCalled();
  });

  it('raises deleteEmpty when Backspace is pressed in an empty doc', async () => {
    const onBoundary = vi.fn(() => true);
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor
        caret="start"
        html=""
        onBoundary={onBoundary}
        onCommit={vi.fn()}
      />
    );

    const editable = await waitForEditable();
    fireEvent.keyDown(editable, { key: 'Backspace' });

    await waitFor(() => {
      expect(onBoundary).toHaveBeenCalledWith({ kind: 'deleteEmpty' });
    });
  });

  it('raises focusPrev when ArrowUp is pressed at document start', async () => {
    const onBoundary = vi.fn(() => true);
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor
        caret="start"
        html="<p>Hello</p>"
        onBoundary={onBoundary}
        onCommit={vi.fn()}
      />
    );

    const editable = await waitForEditable();
    fireEvent.keyDown(editable, { key: 'ArrowUp' });
    await waitFor(() => {
      expect(onBoundary).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'focusPrev' })
      );
    });
  });

  it('raises focusNext when ArrowDown is pressed at document end', async () => {
    const onBoundary = vi.fn(() => true);
    renderWithWorkbench(
      api,
      <HtmlRichTextEditor
        caret="end"
        html="<p>Hello</p>"
        onBoundary={onBoundary}
        onCommit={vi.fn()}
      />
    );

    const editable = await waitForEditable();
    fireEvent.keyDown(editable, { key: 'ArrowDown' });
    await waitFor(() => {
      expect(onBoundary).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'focusNext' })
      );
    });
  });

  it('lets an open variable-suggest menu swallow Enter', async () => {
    const box = {
      top: 100,
      bottom: 120,
      left: 40,
      right: 80,
      width: 40,
      height: 20,
      x: 40,
      y: 100,
      toJSON: () => ({}),
    } as DOMRect;
    const rects = {
      length: 1,
      item: () => box,
      0: box,
    } as unknown as DOMRectList;
    const restore = stubGetClientRects(rects, box);

    api.loadScene({
      ...api.getSnapshot().scene,
      variables: [{ id: 'v1', key: 'title', sample: 'Hello' }],
    });

    const onBoundary = vi.fn(() => true);
    try {
      renderWithWorkbench(
        api,
        <HtmlRichTextEditor
          caret="end"
          html="{{"
          onBoundary={onBoundary}
          onCommit={vi.fn()}
        />
      );

      const editable = await waitForEditable();
      await waitFor(() => {
        expect(
          document.querySelector('[data-openenvx-variable-suggest]')
        ).toBeTruthy();
      });

      fireEvent.keyDown(editable, { key: 'Enter' });
      expect(onBoundary).not.toHaveBeenCalled();
    } finally {
      restore();
    }
  });
});
