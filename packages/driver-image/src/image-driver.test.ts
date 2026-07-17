import { createLayerPreviewBuilder } from '@openenvx/preview';
import { CanvasDocumentExportServiceId } from '@openenvx/canvas/document-export';
import {
  createPropertyBuilder,
  LayerDefinition,
  LayerRegistry,
  Plugin,
} from '@openenvx/core';
import type {
  Layer,
  LayerPreviewContext,
  Page,
  PluginContext,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { DriverImagePlugin } from './driver-image-plugin';
import { ImageDocumentExportService } from './image-document-export-service';
import { renderSvgDocument } from './svg-document-renderer';
import { WorkbenchController } from '@openenvx/headless';

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

  properties(): PropertySectionDescriptor[] {
    return createPropertyBuilder().section('shape').text('fill').build();
  }

  renderPreview(ctx: LayerPreviewContext<{ fill: string }>) {
    return createLayerPreviewBuilder().rect(ctx.model.fill);
  }
}

class RectPlugin extends Plugin {
  readonly id = 'rect';

  activate(ctx: PluginContext): void {
    ctx.register(new StubRectLayer());
  }
}

describe('resolve-scene-assets', () => {
  it('inlines asset refs from scene assets', async () => {
    const { createSceneAssetResolver } = await import('./resolve-scene-assets');
    const resolver = createSceneAssetResolver({
      assets: {
        img1: {
          data: 'abc',
          encoding: 'base64',
          mimeType: 'image/png',
        },
      },
      pages: [],
      schemaVersion: 1,
    });

    expect(resolver('asset://img1')).toBe('data:image/png;base64,abc');
  });
});

describe('renderSvgDocument', () => {
  it('renders page-sized svg with background and layers', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          backgroundColor: '#ffffff',
          height: 300,
          id: 'p1',
          layout: 'absolute',
          name: 'Artboard',
          presetId: 'custom',
          width: 400,
          layers: [
            {
              data: { fill: '#ff0000' },
              id: 'r1',
              transform: {
                height: 80,
                opacity: 1,
                rotation: 0,
                width: 120,
                x: 10,
                y: 20,
              },
              type: 'test.rect',
            },
          ],
        },
      ],
    });

    const registry = new LayerRegistry();
    registry.register(new StubRectLayer());

    const svg = renderSvgDocument(scene, registry, 'p1');

    expect(svg).toContain('width="400"');
    expect(svg).toContain('height="300"');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('fill="#ff0000"');
  });

  it('exports rect layers from renderPreview descriptors', () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          height: 100,
          id: 'p1',
          layout: 'absolute',
          name: 'Artboard',
          width: 100,
          layers: [
            {
              data: { fill: '#00ff00' },
              id: 'r1',
              transform: {
                height: 80,
                opacity: 1,
                rotation: 0,
                width: 80,
                x: 10,
                y: 10,
              },
              type: 'test.rect',
            },
          ],
        },
      ],
    });

    const registry = new LayerRegistry();
    registry.register(new StubRectLayer());
    const svg = renderSvgDocument(scene, registry, 'p1');
    expect(svg).toContain('<rect');
    expect(svg).toContain('#00ff00');
  });
});

describe(ImageDocumentExportService, () => {
  it('exports svg document bytes through exportDocument', async () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          height: 100,
          id: 'p1',
          layout: 'absolute',
          name: 'Artboard',
          width: 100,
          layers: [
            {
              data: { fill: '#00ff00' },
              id: 'r1',
              type: 'test.rect',
            },
          ],
        },
      ],
    });

    const registry = new LayerRegistry();
    registry.register(new StubRectLayer());
    const { PreviewKindSvgSerializerRegistry } = await import(
      './preview-kind-svg-serializer'
    );
    const { registerBuiltinSvgSerializers } = await import(
      './builtin-svg-serializers'
    );
    const serializers = new PreviewKindSvgSerializerRegistry();
    registerBuiltinSvgSerializers(serializers);
    const exporter = new ImageDocumentExportService(registry, serializers);
    const result = await exporter.exportDocument(scene, 'p1', { format: 'svg' });

    const text = new TextDecoder().decode(result.data);
    expect(result.mimeType).toBe('image/svg+xml');
    expect(text).toContain('<svg');
    expect(text).toContain('#00ff00');
  });

  it('adds crop marks to svg export when page has bleed', async () => {
    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          bleedMm: 3,
          dpi: 96,
          height: 200,
          id: 'p1',
          layout: 'absolute',
          name: 'Artboard',
          unit: 'mm',
          width: 300,
          layers: [
            {
              data: { fill: '#00ff00' },
              id: 'r1',
              type: 'test.rect',
            },
          ],
        },
      ],
    });

    const registry = new LayerRegistry();
    registry.register(new StubRectLayer());
    const { PreviewKindSvgSerializerRegistry } = await import(
      './preview-kind-svg-serializer'
    );
    const { registerBuiltinSvgSerializers } = await import(
      './builtin-svg-serializers'
    );
    const serializers = new PreviewKindSvgSerializerRegistry();
    registerBuiltinSvgSerializers(serializers);
    const exporter = new ImageDocumentExportService(registry, serializers);
    const result = await exporter.exportDocument(scene, 'p1', { format: 'svg' });
    const text = new TextDecoder().decode(result.data);

    expect(result.dimensions.widthPx).toBeGreaterThan(300);
    expect(text.match(/<line /g)?.length).toBe(8);
  });

  it('reports unsupported pdf format locally', async () => {
    const registry = new LayerRegistry();
    registry.register(new StubRectLayer());
    const { PreviewKindSvgSerializerRegistry } = await import(
      './preview-kind-svg-serializer'
    );
    const { registerBuiltinSvgSerializers } = await import(
      './builtin-svg-serializers'
    );
    const serializers = new PreviewKindSvgSerializerRegistry();
    registerBuiltinSvgSerializers(serializers);
    const exporter = new ImageDocumentExportService(registry, serializers);

    expect(exporter.supportsFormat('svg')).toBe(true);
    expect(exporter.supportsFormat('png')).toBe(true);
    expect(exporter.supportsFormat('pdf')).toBe(false);

    const scene = normalizeScene({
      activePageId: 'p1',
      pages: [
        {
          height: 100,
          id: 'p1',
          layout: 'absolute',
          name: 'Artboard',
          width: 100,
          layers: [],
        },
      ],
    });

    await expect(
      exporter.exportDocument(scene, 'p1', { format: 'pdf' })
    ).rejects.toThrow(/PDF export requires/);
  });
});

describe(DriverImagePlugin, () => {
  it('registers canvas document export service', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        activePageId: 'p1',
        pages: [
          {
            id: 'p1',
            layout: 'absolute',
            name: 'Artboard',
            width: 100,
            height: 100,
            layers: [],
          },
        ],
      }),
      plugins: [new RectPlugin(), new DriverImagePlugin()],
    });
    await controller.start();
    expect(
      controller.api.getService(CanvasDocumentExportServiceId)
    ).toBeInstanceOf(ImageDocumentExportService);
  });
});
