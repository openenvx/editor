import { WorkbenchProvider } from '@openenvx/studio/react';
import { normalizeScene } from '@openenvx/studio/schema';
import { createMockWorkbenchApi } from '@openenvx/studio/internal';
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CanvasRichTextEditor } from './canvas-rich-text-editor';

vi.mock('@tiptap/react/menus', () => ({
  BubbleMenu: ({ children }: { children?: ReactNode }) => children ?? null,
}));

afterEach(() => {
  cleanup();
});

function renderRichTextEditor(
  props: Omit<ComponentProps<typeof CanvasRichTextEditor>, 'onCommit'> & {
    onCommit?: () => void;
  }
) {
  const { api } = createMockWorkbenchApi({
    scene: normalizeScene({
      pages: [{ id: 'p1', name: 'Page', layout: 'flow', layers: [] }],
    }),
  });
  const view = render(
    <WorkbenchProvider api={api}>
      <CanvasRichTextEditor onCommit={() => {}} {...props} />
    </WorkbenchProvider>
  );
  return { api, ...view };
}

describe('CanvasRichTextEditor', () => {
  it('renders TipTap content from html', async () => {
    const { container } = renderRichTextEditor({
      html: '<p><strong>Bold</strong> text</p>',
      zoom: 1,
    });

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    expect(container.querySelector('strong')?.textContent).toBe('Bold');
  });

  it('selects all text on mount', async () => {
    renderRichTextEditor({
      html: '<p><strong>Bold</strong> text</p>',
      zoom: 1,
    });

    await waitFor(() => {
      expect(window.getSelection()?.toString()).toBe('Bold text');
    });
  });
});
