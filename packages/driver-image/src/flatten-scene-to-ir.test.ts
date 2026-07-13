import { createLayerPreviewBuilder, RawSvgDescriptor } from '@openenvx/preview';
import {
  createPropertyBuilder,
  LayerDefinition,
  LayerRegistry,
} from '@openenvx/core';
import type { Layer, LayerPreviewContext, Page } from '@openenvx/core';
import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { flattenSceneToIR } from './flatten-scene-to-ir';
import { renderIrDocument } from './ir-document-renderer';

class StubRectLayer extends LayerDefinition<{ fill: string }> {
  readonly type = 'test.rect';
  readonly treeIcon = 'rect';
  readonly treeDisplayName = 'Rectangle';

  createDefault(id: string, _page: Page): Layer {
    return { data: { fill: '#000' }, id, type: this.type };
  }

  serialize(layer: Layer) {
    return layer.data as { fill: string };
  }

  deserialize(data: unknown) {
    return data as { fill: string };
  }

  properties() {
    return createPropertyBuilder().section('shape').text('fill').build();
  }

  renderPreview(ctx: LayerPreviewContext<{ fill: string }>) {
    return createLayerPreviewBuilder().rect(ctx.model.fill);
  }
}

class StubCustomLayer extends LayerDefinition<{ label: string }> {
  readonly type = 'test.custom';
  readonly treeIcon = 'custom';
  readonly treeDisplayName = 'Custom';

  createDefault(id: string, _page: Page): Layer {
    return { data: { label: 'Custom' }, id, type: this.type };
  }

  serialize(layer: Layer) {
    return layer.data as { label: string };
  }

  deserialize(data: unknown) {
    return data as { label: string };
  }

  properties() {
    return createPropertyBuilder().section('custom').text('label').build();
  }

  renderPreview(ctx: LayerPreviewContext<{ label: string }>) {
    return { kind: 'customWidget', label: ctx.model.label };
  }
}

function createRegistry(): LayerRegistry {
  const registry = new LayerRegistry();
  registry.register(new StubRectLayer());
  registry.register(new StubCustomLayer());
  return registry;
}

function createScene() {
  return normalizeScene({
    activePageId: 'p1',
    pages: [
      {
        height: 200,
        id: 'p1',
        layout: 'absolute',
        name: 'Artboard',
        width: 300,
        layers: [
          {
            data: { fill: '#3b82f6' },
            id: 'rect-1',
            transform: {
              height: 80,
              opacity: 1,
              rotation: 0,
              width: 120,
              x: 20,
              y: 30,
            },
            type: 'test.rect',
          },
          {
            data: { label: 'Widget' },
            id: 'custom-1',
            transform: {
              height: 40,
              opacity: 1,
              rotation: 0,
              width: 80,
              x: 160,
              y: 40,
            },
            type: 'test.custom',
          },
        ],
      },
    ],
  });
}

describe('flattenSceneToIR', () => {
  it('keeps known preview kinds and converts unknown kinds to raw svg', () => {
    const scene = createScene();
    const registry = createRegistry();
    const ir = flattenSceneToIR(scene, registry, 'p1');

    expect(ir.irVersion).toBe(1);
    expect(ir.nodes).toHaveLength(2);
    expect(ir.nodes[0]?.descriptor).toMatchObject({
      fill: '#3b82f6',
      kind: 'rect',
    });
    const rawDescriptor = ir.nodes[1]?.descriptor;
    expect(rawDescriptor).toMatchObject({ kind: 'raw' });
    expect((rawDescriptor as RawSvgDescriptor).svg.length).toBeGreaterThan(0);
  });
});

describe('renderIrDocument', () => {
  it('renders flattened IR to svg', () => {
    const scene = createScene();
    const registry = createRegistry();
    const ir = flattenSceneToIR(scene, registry, 'p1');
    const result = renderIrDocument(ir, { mode: 'lenient' });

    expect(result.svg).toContain('<svg');
    expect(result.svg).toContain('<rect');
    expect(result.diagnostics).toHaveLength(0);
  });

  it('rejects unsupported ir versions', () => {
    const scene = createScene();
    const registry = createRegistry();
    const ir = flattenSceneToIR(scene, registry, 'p1');

    expect(() =>
      renderIrDocument({ ...ir, irVersion: 99 as never })
    ).toThrow(/Unsupported render IR version/);
  });
});
