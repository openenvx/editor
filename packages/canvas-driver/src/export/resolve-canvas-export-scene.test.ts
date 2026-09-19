import {
  formatVariableToken,
  normalizeScene,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { resolveCanvasExportScene } from './resolve-canvas-export-scene';

describe('resolveCanvasExportScene', () => {
  it('substitutes known variable keys', () => {
    const token = formatVariableToken('name');
    const scene = normalizeScene({
      pages: [
        {
          id: 'page-1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
              id: 'text-1',
              type: 'canvas.text',
              data: {
                align: 'center',
                html: `<p>Hello ${token}</p>`,
              },
              transform: {
                x: 48,
                y: 100,
                width: 700,
                height: 80,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });
    const resolved = resolveCanvasExportScene(scene, {
      variables: { name: 'Ada' },
    });
    const layer = resolved.pages[0]!.layers[0]!;
    expect((layer.data as { html: string }).html).toBe('<p>Hello Ada</p>');
    expect(layer.transform!.x).toBe(48);
    expect(layer.transform!.width).toBe(700);
  });

  it('leaves unknown tokens when key is missing from values', () => {
    const known = formatVariableToken('name');
    const unknown = formatVariableToken('missing');
    const scene = normalizeScene({
      pages: [
        {
          id: 'page-1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
              id: 'text-1',
              type: 'canvas.text',
              data: { html: `<p>${known} ${unknown}</p>` },
              transform: {
                x: 0,
                y: 0,
                width: 400,
                height: 100,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });
    const resolved = resolveCanvasExportScene(scene, {
      variables: { name: 'Ada' },
    });
    const html = (resolved.pages[0]!.layers[0]!.data as { html: string }).html;
    expect(html).toContain('Ada');
    expect(html).toContain(unknown);
  });

  it('hugs width after variable substitution', () => {
    const token = formatVariableToken('title');
    const scene = normalizeScene({
      pages: [
        {
          id: 'page-1',
          layout: 'absolute',
          width: 800,
          height: 600,
          layers: [
            {
              id: 't1',
              type: 'canvas.text',
              data: {
                align: 'center',
                autoFit: 'hug',
                html: `<p>${token}</p>`,
              },
              transform: {
                x: 150,
                y: 200,
                width: 500,
                height: 64,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });
    const resolved = resolveCanvasExportScene(scene, {
      variables: { title: 'Engineer' },
    });
    const layer = resolved.pages[0]!.layers[0]!;
    expect(layer.transform!.x).toBe(150);
    expect(layer.transform!.width).toBeLessThan(500);
  });
});
