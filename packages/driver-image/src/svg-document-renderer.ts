import { getActivePage } from '@openenvx/core';
import type { LayerRegistry } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type { Layer, Page, Scene, Transform } from '@openenvx/schema';
import {
  computePageExportDimensions,
  resolvePageBackground,
} from '@openenvx/schema';

import {
  registerBuiltinSvgSerializers,
  serializePreviewDescriptor,
} from './builtin-svg-serializers';
import { flattenLayersForExport } from './flatten-layers-for-export';
import type { PreviewKindSvgSerializerRegistry } from './preview-kind-svg-serializer';
import { getDefaultSerializerRegistry } from './preview-kind-svg-serializer';
import { createSceneAssetResolver } from './resolve-scene-assets';
import { wrapLayerSvg } from './svg-transform';

export interface SvgDocumentRenderOptions {
  scale?: number;
  dpi?: number;
  background?: string;
  resolveAsset?: (ref: string) => string;
  useRichText?: boolean;
  serializers?: PreviewKindSvgSerializerRegistry;
}

function resolvePage(scene: Scene, pageId: string): Page {
  return scene.pages.find((page) => page.id === pageId) ?? getActivePage(scene);
}

function resolveLayerPreviewForExport(
  descriptor: LayerPreviewDescriptor,
  resolveAsset: (ref: string) => string
): LayerPreviewDescriptor {
  if (descriptor.kind !== 'image' || typeof descriptor.src !== 'string') {
    return descriptor;
  }
  return {
    ...descriptor,
    src: resolveAsset(descriptor.src),
  };
}

function renderLayerSvg(
  layer: Layer,
  transform: Transform,
  layerRegistry: LayerRegistry,
  serializers: PreviewKindSvgSerializerRegistry,
  scene: Scene,
  pageId: string,
  resolveAsset: (ref: string) => string,
  useRichText: boolean
): string {
  const def = layerRegistry.get(layer.type);
  if (!def) {
    return '';
  }

  const previewCtx = {
    isSelected: false,
    layerId: layer.id,
    model: def.getModel(layer),
    registry: layerRegistry,
  };
  const descriptor = resolveLayerPreviewForExport(
    def.renderPreview(previewCtx),
    resolveAsset
  );
  const body = serializePreviewDescriptor(descriptor, serializers, {
    bounds: {
      height: transform.height,
      width: transform.width,
      x: transform.x,
      y: transform.y,
    },
    layer,
    layerRegistry,
    pageId,
    resolveAsset,
    scene,
    useRichText,
  });
  if (!body) {
    return '';
  }

  return wrapLayerSvg(body, transform);
}

export function renderSvgDocument(
  scene: Scene,
  layerRegistry: LayerRegistry,
  pageId: string,
  options: SvgDocumentRenderOptions = {}
): string {
  const page = resolvePage(scene, pageId);
  if (page.layout !== 'absolute') {
    throw new Error('Only absolute canvas pages can be exported');
  }

  const dimensions = computePageExportDimensions(page, {
    dpi: options.dpi,
    scale: options.scale,
  });
  const background = options.background ?? resolvePageBackground(page);
  const resolveAsset = options.resolveAsset ?? createSceneAssetResolver(scene);
  const useRichText = options.useRichText ?? typeof document !== 'undefined';
  const serializers =
    options.serializers ?? getDefaultSerializerRegistryWithBuiltins();

  const bodies = flattenLayersForExport(page.layers)
    .map(({ layer, transform }) =>
      renderLayerSvg(
        layer,
        transform,
        layerRegistry,
        serializers,
        scene,
        pageId,
        resolveAsset,
        useRichText
      )
    )
    .filter(Boolean)
    .join('\n');

  const backgroundRect =
    background === 'transparent'
      ? ''
      : `<rect width="100%" height="100%" fill="${background}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.widthPx}" height="${dimensions.heightPx}" viewBox="0 0 ${dimensions.widthPx} ${dimensions.heightPx}">${backgroundRect}${bodies}</svg>`;
}

export function renderSvgDocumentFromOptions(
  scene: Scene,
  layerRegistry: LayerRegistry,
  pageId: string,
  options: Pick<
    SvgDocumentRenderOptions,
    'background' | 'dpi' | 'scale' | 'serializers'
  > = {}
): string {
  return renderSvgDocument(scene, layerRegistry, pageId, {
    background: options.background,
    dpi: options.dpi,
    scale: options.scale,
    serializers: options.serializers,
    useRichText: true,
  });
}

function getDefaultSerializerRegistryWithBuiltins(): PreviewKindSvgSerializerRegistry {
  const registry = getDefaultSerializerRegistry();
  registerBuiltinSvgSerializers(registry);
  return registry;
}
