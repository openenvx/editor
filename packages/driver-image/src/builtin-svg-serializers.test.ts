import { createLayerPreviewBuilder } from '@openenvx/preview';
import { describe, expect, it } from 'vitest';

import {
  registerBuiltinSvgSerializers,
  serializePreviewDescriptor,
} from './builtin-svg-serializers';
import { PreviewKindSvgSerializerRegistry } from './preview-kind-svg-serializer';

function createRegistry(): PreviewKindSvgSerializerRegistry {
  const registry = new PreviewKindSvgSerializerRegistry();
  registerBuiltinSvgSerializers(registry);
  return registry;
}

describe('serializePreviewDescriptor', () => {
  it('lays out vertical stack children in local coordinates', () => {
    const registry = createRegistry();
    const builder = createLayerPreviewBuilder();
    const descriptor = builder.stack('vertical', [
      builder.rect('#ff0000'),
      builder.rect('#00ff00'),
    ]);

    const svg = serializePreviewDescriptor(descriptor, registry, {
      bounds: { height: 100, width: 80, x: 10, y: 20 },
      layer: {
        data: {},
        id: 'stack-1',
        type: 'test.stack',
      },
      layerRegistry: {} as never,
      pageId: 'p1',
      resolveAsset: (ref) => ref,
      scene: { pages: [], schemaVersion: 1 } as never,
      useRichText: false,
    });

    expect(svg).toContain('translate(10 20)');
    expect(svg).toContain('x="0" y="0" width="80" height="50"');
    expect(svg).toContain('x="0" y="50" width="80" height="50"');
    expect(svg).toContain('#ff0000');
    expect(svg).toContain('#00ff00');
  });

  it('lays out horizontal stack children in local coordinates', () => {
    const registry = createRegistry();
    const builder = createLayerPreviewBuilder();
    const descriptor = builder.stack('horizontal', [
      builder.rect('#ff0000'),
      builder.rect('#00ff00'),
    ]);

    const svg = serializePreviewDescriptor(descriptor, registry, {
      bounds: { height: 40, width: 100, x: 5, y: 15 },
      layer: {
        data: {},
        id: 'stack-1',
        type: 'test.stack',
      },
      layerRegistry: {} as never,
      pageId: 'p1',
      resolveAsset: (ref) => ref,
      scene: { pages: [], schemaVersion: 1 } as never,
      useRichText: false,
    });

    expect(svg).toContain('translate(5 15)');
    expect(svg).toContain('x="0" y="0" width="50" height="40"');
    expect(svg).toContain('x="50" y="0" width="50" height="40"');
  });
});
