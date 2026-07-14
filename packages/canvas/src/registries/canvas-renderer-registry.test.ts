import { describe, expect, it } from 'vitest';

import { CanvasLayerInteractionContribution } from '../contributions/canvas-layer-interaction-contribution';
import { CanvasLayerRendererContribution } from '../contributions/canvas-layer-renderer-contribution';
import { LayerPreviewRendererContribution } from '../contributions/layer-preview-renderer-contribution';
import { createCanvasRegistriesService } from '../plugin/canvas-registry-service';

class TestCanvasRenderer extends CanvasLayerRendererContribution {
  readonly kind = 'chart';
  readonly Component = () => null;
}

class OverrideCanvasRenderer extends CanvasLayerRendererContribution {
  readonly kind = 'chart';
  readonly Component = () => null;
}

class TestCanvasInteraction extends CanvasLayerInteractionContribution {
  readonly kind = 'chart';

  providesHandles() {
    return true;
  }
}

class OverrideCanvasInteraction extends CanvasLayerInteractionContribution {
  readonly kind = 'chart';

  providesHandles() {
    return false;
  }
}

class TestPreviewRenderer extends LayerPreviewRendererContribution {
  readonly kind = 'chart';
  readonly Component = () => null;
}

class OverridePreviewRenderer extends LayerPreviewRendererContribution {
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

  it('allows overriding an existing renderer kind', () => {
    const service = createCanvasRegistriesService();
    service.registerCanvasLayerRenderer(new TestCanvasRenderer());
    service.registerCanvasLayerRenderer(new OverrideCanvasRenderer(), {
      override: true,
    });
    expect(service.getSnapshot().canvasLayerRenderers).toHaveLength(1);
  });
});

describe('canvas layer interaction registry', () => {
  it('allows overriding an existing interaction kind', () => {
    const service = createCanvasRegistriesService();
    service.registerCanvasLayerInteraction(new TestCanvasInteraction());
    service.registerCanvasLayerInteraction(new OverrideCanvasInteraction(), {
      override: true,
    });
    const interaction = service
      .getSnapshot()
      .canvasLayerInteractions.find((entry) => entry.kind === 'chart');
    expect(interaction?.providesHandles?.({})).toBe(false);
  });
});

describe('layer preview renderer registry', () => {
  it('allows overriding an existing preview renderer kind', () => {
    const service = createCanvasRegistriesService();
    service.registerLayerPreviewRenderer(new TestPreviewRenderer());
    service.registerLayerPreviewRenderer(new OverridePreviewRenderer(), {
      override: true,
    });
    expect(service.getSnapshot().layerPreviewRenderers).toHaveLength(1);
  });
});
