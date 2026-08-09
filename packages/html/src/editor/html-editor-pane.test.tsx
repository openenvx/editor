import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { getNestedValue } from '@openenvx/core';
import { afterEach, describe, expect, it } from 'vitest';

import {
  createHtmlWorkbench,
  renderWithWorkbench,
} from '../test/html-editor-harness';
import { HtmlEditorPane } from './html-editor-pane';

afterEach(cleanup);

/** jsdom elements have 0×0 boxes — floating selection pill hides without this. */
async function withMockedBlockRects(
  run: () => void | Promise<void>
): Promise<void> {
  const proto = HTMLElement.prototype as HTMLElement & {
    getBoundingClientRect: () => DOMRect;
  };
  const original = proto.getBoundingClientRect;
  proto.getBoundingClientRect = function getBoundingClientRect() {
    return {
      top: 40,
      left: 40,
      bottom: 200,
      right: 400,
      width: 360,
      height: 160,
      x: 40,
      y: 40,
      toJSON: () => ({}),
    } as DOMRect;
  };
  try {
    await run();
  } finally {
    proto.getBoundingClientRect = original;
  }
}

describe('HtmlEditorPane', () => {
  it('renders demo scene and updates selection on click', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      renderWithWorkbench(api, <HtmlEditorPane />);

      expect(screen.getByText('Welcome')).toBeTruthy();
      fireEvent.click(screen.getByText('Welcome'));

      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toContain(
          'hero-1'
        );
      });
      fireEvent.click(screen.getByText('Below the hero'));
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
      await withMockedBlockRects(async () => {
        api.selectLayers(['text-1'], 'text-1');
        renderWithWorkbench(api, <HtmlEditorPane />);

        fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }));
        await waitFor(() => {
          const root = api.getSnapshot().scene.pages[0]!.layers[0]!;
          const children = (
            root.data as { children: { type: string }[] }
          ).children;
          expect(
            children.filter((c) => c.type === 'html.text').length
          ).toBeGreaterThan(1);
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
      });
    } finally {
      dispose();
    }
  });

  it('replaces the selected block image via AssetService.upload', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      await withMockedBlockRects(async () => {
        api.selectLayers(['hero-1'], 'hero-1');
        renderWithWorkbench(api, <HtmlEditorPane />);

        expect(
          await screen.findByRole('button', { name: 'Replace image' })
        ).toBeTruthy();

        const file = new File([Uint8Array.from([1, 2, 3, 4])], 'hero.png', {
          type: 'image/png',
        });
        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        await waitFor(() => {
          const root = api.getSnapshot().scene.pages[0]!.layers[0]!;
          const hero = (
            root.data as {
              children: {
                id: string;
                data: { backgroundImage?: string };
              }[];
            }
          ).children.find((layer) => layer.id === 'hero-1');
          expect(hero?.data.backgroundImage?.startsWith('asset://')).toBe(true);
        });
      });
    } finally {
      dispose();
    }
  });

  it('commits rich text edits and ignores Escape while editing', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);
      fireEvent.click(screen.getByText('Welcome'));

      await waitFor(() => {
        expect(document.querySelector('[contenteditable="true"]')).toBeTruthy();
      });

      const canvas = container.querySelector('[role="tree"]') as HTMLElement;
      fireEvent.keyDown(canvas, { key: 'Escape' });
      expect(api.getSnapshot().selection.selectedLayerIds).toContain('hero-1');

      const editable = document.querySelector(
        '[contenteditable="true"]'
      ) as HTMLElement;
      fireEvent.blur(editable);

      await waitFor(() => {
        expect(document.querySelector('[contenteditable="true"]')).toBeNull();
      });

      await waitFor(() => {
        const root = api.getSnapshot().scene.pages[0]!.layers[0]!;
        const hero = (
          root.data as { children: { id: string; data?: unknown }[] }
        ).children.find((layer) => layer.id === 'hero-1');
        expect(hero).toBeTruthy();
        const headlineHtml = getNestedValue(
          hero!.data as Record<string, unknown>,
          'slots.headline.0.data.html'
        );
        expect(String(headlineHtml)).toBe('Welcome');
      });
    } finally {
      dispose();
    }
  });

  it('clears selection when clicking the stage outside the artboard', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      const { container } = renderWithWorkbench(api, <HtmlEditorPane />);
      const stage = container.querySelector('[role="tree"]') as HTMLElement;
      fireEvent.click(stage);
      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toEqual([]);
      });
    } finally {
      dispose();
    }
  });

  it('selects the page root when clicking the artboard', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      api.selectLayers(['heading-1'], 'heading-1');
      renderWithWorkbench(api, <HtmlEditorPane />);
      fireEvent.click(screen.getByTestId('html-artboard'));
      await waitFor(() => {
        expect(api.getSnapshot().selection.selectedLayerIds).toEqual(['root']);
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

  it('shows empty state when the page has no root block', async () => {
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
      expect(screen.getByText('No root block on this page.')).toBeTruthy();
    } finally {
      dispose();
    }
  });

  it('switches device frame width via preview chrome commands', async () => {
    const { api, dispose } = await createHtmlWorkbench();
    try {
      renderWithWorkbench(api, <HtmlEditorPane />);

      const artboard = screen.getByTestId('html-artboard');
      expect(artboard.dataset.device).toBe('fluid');

      await api.executeCommand('html.setDevicePreset', { preset: 'mobile' });
      await waitFor(() => {
        expect(artboard.dataset.device).toBe('mobile');
        expect(artboard.style.width).toBe('390px');
      });

      await api.executeCommand('html.setDevicePreset', { preset: 'desktop' });
      await waitFor(() => {
        expect(artboard.dataset.device).toBe('desktop');
        expect(artboard.style.width).toBe('1600px');
      });

      await api.executeCommand('html.setDevicePreset', { preset: 'fluid' });
      await waitFor(() => {
        expect(artboard.dataset.device).toBe('fluid');
      });

      await api.executeCommand('html.setDevicePreset', { preset: 'desktop' });
      await api.executeCommand('html.zoomPercent', { zoom: 0.5 });
      await waitFor(() => {
        // 50% of fit-width; in jsdom stage is often ≥ frame so fit=1 → 800px.
        expect(Number.parseFloat(artboard.style.width)).toBeGreaterThan(0);
        expect(Number.parseFloat(artboard.style.width)).toBeLessThanOrEqual(
          1600
        );
      });

      await api.executeCommand('html.zoomIn');
      await waitFor(() => {
        expect(Number.parseFloat(artboard.style.width)).toBeGreaterThan(0);
      });

      await api.executeCommand('html.zoomPercent', { zoom: 0.25 });
      await waitFor(() => {
        expect(Number.parseFloat(artboard.style.width)).toBeGreaterThan(0);
      });

      await api.executeCommand('html.zoomAuto');
      await waitFor(() => {
        // 100% = fit-width — scaled slot never exceeds the design frame.
        expect(Number.parseFloat(artboard.style.width)).toBeGreaterThan(0);
        expect(Number.parseFloat(artboard.style.width)).toBeLessThanOrEqual(
          1600
        );
      });
    } finally {
      dispose();
    }
  });
});
