import type { LayerRegistry } from '@openenvx/core';
import {
  RENDER_IR_VERSION,
  isServerKnownPreviewKind,
  type LayerPreviewDescriptor,
  type RenderIrDescriptor,
  type RenderIrDocument,
  type RenderIrNode,
} from '@openenvx/preview';
import type { Layer, Scene } from '@openenvx/schema';
import {
  createDefaultTransform,
  resolvePageBackground,
  resolvePageBleedMm,
  resolvePagePixelDimensions,
} from '@openenvx/schema';

import {
  registerBuiltinSvgSerializers,
  serializePreviewDescriptor,
} from './builtin-svg-serializers';
import { flattenLayersForExport } from './flatten-layers-for-export';
import type { PreviewKindSvgSerializerRegistry } from './preview-kind-svg-serializer';
import { getDefaultSerializerRegistry } from './preview-kind-svg-serializer';
import { createSceneAssetResolver } from './resolve-scene-assets';

export interface FlattenSceneToIrOptions {
  serializers?: PreviewKindSvgSerializerRegistry;
}

function resolveDescriptorAssets(
  descriptor: LayerPreviewDescriptor,
  resolveAsset: (ref: string) => string
): LayerPreviewDescriptor {
  if (descriptor.kind === 'image' && typeof descriptor.src === 'string') {
    return { ...descriptor, src: resolveAsset(descriptor.src) };
  }

  if (descriptor.kind === 'stack' && Array.isArray(descriptor.children)) {
    return {
      ...descriptor,
      children: descriptor.children.map((child) =>
        resolveDescriptorAssets(child, resolveAsset)
      ),
    };
  }

  return descriptor;
}

function descriptorToRawSvg(
  descriptor: LayerPreviewDescriptor,
  layer: Layer,
  scene: Scene,
  pageId: string,
  layerRegistry: LayerRegistry,
  resolveAsset: (ref: string) => string,
  serializers: PreviewKindSvgSerializerRegistry
): string | null {
  const transform = layer.transform ?? createDefaultTransform();
  return serializePreviewDescriptor(descriptor, serializers, {
    bounds: {
      height: transform.height,
      width: transform.width,
      x: 0,
      y: 0,
    },
    layer,
    layerRegistry,
    pageId,
    resolveAsset,
    scene,
    useRichText: typeof document !== 'undefined',
  });
}

function flattenDescriptor(
  descriptor: LayerPreviewDescriptor,
  layer: Layer,
  scene: Scene,
  pageId: string,
  layerRegistry: LayerRegistry,
  resolveAsset: (ref: string) => string,
  serializers: PreviewKindSvgSerializerRegistry
): RenderIrDescriptor {
  const resolved = resolveDescriptorAssets(descriptor, resolveAsset);

  if (isServerKnownPreviewKind(resolved.kind)) {
    return resolved;
  }

  const rawSvg = descriptorToRawSvg(
    resolved,
    layer,
    scene,
    pageId,
    layerRegistry,
    resolveAsset,
    serializers
  );

  if (rawSvg) {
    return { kind: 'raw', svg: rawSvg };
  }

  return {
    kind: 'raw',
    svg: `<text x="0" y="16" font-size="14" fill="#6b7280">Unsupported preview kind: ${resolved.kind}</text>`,
  };
}

export function flattenSceneToIR(
  scene: Scene,
  layerRegistry: LayerRegistry,
  pageId: string,
  options: FlattenSceneToIrOptions = {}
): RenderIrDocument {
  const page = scene.pages.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Page not found: ${pageId}`);
  }

  if (page.layout !== 'absolute') {
    throw new Error('Only absolute canvas pages can be exported');
  }

  const serializers = options.serializers ?? getDefaultSerializerRegistry();
  registerBuiltinSvgSerializers(serializers);
  const resolveAsset = createSceneAssetResolver(scene);
  const { width, height } = resolvePagePixelDimensions(page);

  const nodes: RenderIrNode[] = flattenLayersForExport(
    page.layers,
    undefined,
    scene
  ).map(({ layer, transform }) => {
    const def = layerRegistry.get(layer.type);

    if (!def) {
      return {
        descriptor: {
          kind: 'placeholder',
          text: `Unknown layer: ${layer.type}`,
        },
        id: layer.id,
        transform,
      };
    }

    const previewCtx = {
      isSelected: false,
      layerId: layer.id,
      model: def.getModel(layer),
      registry: layerRegistry,
    };

    return {
      descriptor: flattenDescriptor(
        def.renderPreview(previewCtx),
        layer,
        scene,
        pageId,
        layerRegistry,
        resolveAsset,
        serializers
      ),
      id: layer.id,
      transform,
    };
  });

  return {
    assets: scene.assets as RenderIrDocument['assets'],
    irVersion: RENDER_IR_VERSION,
    nodes,
    page: {
      background: resolvePageBackground(page),
      bleedMm: resolvePageBleedMm(page),
      dpi: page.dpi,
      height,
      presetId: page.presetId,
      unit: page.unit,
      width,
    },
  };
}
