import {
  applyTemplateVariablesForPreview,
  formatVariableToken,
  normalizeScene,
} from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { mapLayerSurfaceForVariablePreview } from './map-layer-surface-for-variable-preview';
import type { CanvasLayerSurfaceItem } from '../layer-surface-item';

describe('mapLayerSurfaceForVariablePreview', () => {
  it('keeps box width and substitutes sample html for preview', () => {
    const token = formatVariableToken('title');
    const storedWidth = 500;
    const scene = normalizeScene({
      variables: [{ id: 'v1', key: 'title', sample: 'Engineer' }],
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
                html: `<p>${token}</p>`,
              },
              transform: {
                x: 150,
                y: 200,
                width: storedWidth,
                height: 64,
                rotation: 0,
                opacity: 1,
              },
            },
          ],
        },
      ],
    });

    const layer = scene.pages[0]!.layers[0]!;
    const layerSurface: CanvasLayerSurfaceItem[] = [
      {
        layer,
        view: {
          kind: 'richText',
          html: (layer.data as { html: string }).html,
          align: 'center',
        },
      },
    ];

    const mapped = mapLayerSurfaceForVariablePreview(layerSurface, scene);
    expect(mapped[0]!.layer.transform!.width).toBe(storedWidth);
    expect(mapped[0]!.layer.transform!.x).toBe(150);
    expect((mapped[0]!.view as { html: string }).html).toBe('<p>Engineer</p>');

    const previewOnly = applyTemplateVariablesForPreview(scene);
    expect(previewOnly.pages[0]!.layers[0]!.transform!.width).toBe(
      storedWidth
    );
    expect((layer.data as { html: string }).html).toContain(token);
  });

  it('hugs preview width for autoFit hug layers', () => {
    const token = formatVariableToken('title');
    const scene = normalizeScene({
      variables: [{ id: 'v1', key: 'title', sample: 'Engineer' }],
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

    const layer = scene.pages[0]!.layers[0]!;
    const layerSurface: CanvasLayerSurfaceItem[] = [
      {
        layer,
        view: {
          kind: 'richText',
          html: (layer.data as { html: string }).html,
          align: 'center',
        },
      },
    ];

    const mapped = mapLayerSurfaceForVariablePreview(layerSurface, scene);
    expect(mapped[0]!.layer.transform!.width).toBeLessThan(500);
    expect((layerSurface[0]!.layer.data as { html: string }).html).toContain(
      token
    );
  });
});
