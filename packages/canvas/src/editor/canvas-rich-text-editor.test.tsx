import { render, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CanvasRichTextEditor } from './canvas-rich-text-editor';

describe('CanvasRichTextEditor', () => {
  it('renders TipTap content from html', async () => {
    const { container } = render(
      <CanvasRichTextEditor
        html="<p><strong>Bold</strong> text</p>"
        onCommit={() => {}}
        zoom={1}
      />
    );

    await waitFor(() => {
      expect(container.querySelector('.ProseMirror')).toBeTruthy();
    });

    expect(container.querySelector('strong')?.textContent).toBe('Bold');
  });

  it('selects all text on mount', async () => {
    render(
      <CanvasRichTextEditor
        html="<p><strong>Bold</strong> text</p>"
        onCommit={() => {}}
        zoom={1}
      />
    );

    await waitFor(() => {
      expect(window.getSelection()?.toString()).toBe('Bold text');
    });
  });
});
