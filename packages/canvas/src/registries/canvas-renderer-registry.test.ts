import { describe, expect, it } from 'vitest';

import { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import { createCanvasRegistriesService } from '../plugin/canvas-registry-service';

class TestCanvasRenderer extends CanvasLayerRendererContribution {
  readonly kind = 'chart';
  readonly Component = () => null;
}

describe('canvas layer renderer registry', () => {
  it('registers renderers by preview kind', () => {
    const service = createCanvasRegistriesService();
    service.registerCanvasLayerRenderer(new TestCanvasRenderer());
    expect(
      service.getSnapshot().canvasLayerRenderers.find((r) => r.kind === 'chart')
    ).toBeTruthy();
  });

  it('rejects duplicate preview kinds', () => {
    const service = createCanvasRegistriesService();
    service.registerCanvasLayerRenderer(new TestCanvasRenderer());
    expect(() =>
      service.registerCanvasLayerRenderer(new TestCanvasRenderer())
    ).toThrow(/already registered/i);
  });
});
