import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { CanvasImageLayer } from './canvas-image-layer';

describe('CanvasImageLayer', () => {
  it('tolerates unknown crop data in passthrough schema', () => {
    const layer = new CanvasImageLayer();
    expect(
      layer.validate({
        alt: 'Alt',
        assetRef: 'asset://image.png',
        crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
      })
    ).toBe(true);
  });

  it('preserves unknown fields through deserialize', () => {
    const layer = new CanvasImageLayer();
    const model = layer.deserialize({
      alt: 'Alt',
      assetRef: 'asset://image.png',
      crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
    });
    expect(model.crop).toEqual({
      height: 0.5,
      width: 0.5,
      x: 0.25,
      y: 0.25,
    });
  });

  it('forwards unknown preview fields from renderPreview', () => {
    const layer = new CanvasImageLayer();
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [{ id: 'p1', layout: 'absolute', layers: [], name: 'Page' }],
    });
    const created = layer.createDefault('image-1', scene.pages[0]!);
    const view = layer.renderPreview({
      isSelected: false,
      layerId: created.id,
      model: {
        alt: 'Alt',
        assetRef: 'asset://image.png',
        crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
      },
    });
    expect(view).toEqual({
      alt: 'Alt',
      crop: { height: 0.5, width: 0.5, x: 0.25, y: 0.25 },
      kind: 'image',
      src: 'asset://image.png',
    });
  });
});
