import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createHtmlWorkbench,
  renderWithWorkbench,
} from '../test/html-editor-harness';
import { HtmlEditorPane } from './html-editor-pane';

afterEach(cleanup);

describe('HtmlEditorPane', () => {
  it('renders demo scene and updates selection on click', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      renderWithWorkbench(api, <HtmlEditorPane />);

      expect(screen.getByText('Welcome')).toBeTruthy();
      fireEvent.click(screen.getByText('Welcome'));

      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toContain(
          'heading-1'
        );
      });
    } finally {
      dispose();
    }
  });

  it('clears selection when Escape is pressed on the canvas', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);

      const canvas = container.querySelector('[role="tree"]') as HTMLElement;
      expect(canvas).toBeTruthy();
      fireEvent.keyDown(canvas, { key: 'Escape' });

      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toEqual([]);
      });
    } finally {
      dispose();
    }
  });

  it('duplicates and removes via selection menu', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['text-1'], 'text-1');
      renderWithWorkbench(api, <HtmlEditorPane />);

      fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
      await waitFor(() => {
        const root = api.getSnapshot().scene.pages[0]!.layers[0]!;
        const children = (
          root.data as { children: { type: string }[] }
        ).children;
        expect(children.filter((c) => c.type === 'html.text').length).toBeGreaterThan(
          1
        );
      });

      const selected =
        api.getSnapshot().selection.primaryLayerId ??
        api.getSnapshot().selection.selectedLayerIds[0]!;
      api.selectLayers([selected], selected);
      fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
      await waitFor(() => {
        expect(
          api.getSnapshot().selection.selectedLayerIds
        ).not.toContain(selected);
      });
    } finally {
      dispose();
    }
  });

  it('commits rich text edits and ignores Escape while editing', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);
      fireEvent.doubleClick(screen.getByText('Welcome'));

      await waitFor(() => {
        expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
      });

      const canvas = container.querySelector('[role="tree"]') as HTMLElement;
      fireEvent.keyDown(canvas, { key: 'Escape' });
      expect(api.getSnapshot().selection.selectedLayerIds).toContain('heading-1');

      const editable = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      fireEvent.blur(editable);

      await waitFor(() => {
        expect(document.querySelector('[contenteditable="true"]')).toBeNull();
      });
    } finally {
      dispose();
    }
  });

  it('clears selection when clicking the canvas background', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);
      const canvas = container.querySelector('[role="tree"]') as HTMLElement;
      fireEvent.click(canvas);
      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toEqual([]);
      });
    } finally {
      dispose();
    }
  });

  it('ignores non-Escape canvas keydowns', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);
      const canvas = container.querySelector('[role="tree"]') as HTMLElement;
      fireEvent.keyDown(canvas, { key: 'a' });
      expect(api.getSnapshot().selection.selectedLayerIds).toContain('heading-1');
    } finally {
      dispose();
    }
  });

  it('shows empty state when the page has no html.root', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.loadScene({
        schemaVersion: api.getSnapshot().scene.schemaVersion,
        pages: [
          {
            id: 'html-page',
            name: 'Empty',
            layout: 'html',
            layers: [],
          },
        ],
      });
      renderWithWorkbench(api, <HtmlEditorPane />);
      expect(screen.getByText('No html.root block on this page.')).toBeTruthy();
    } finally {
      dispose();
    }
  });
});
