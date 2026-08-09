import type { Layer, Scene } from '@openenvx/core/schema';

function* walkLayers(layers: Layer[]): Generator<Layer> {
  for (const layer of layers) {
    yield layer;

    if (
      layer.type === 'container' &&
      typeof layer.data === 'object' &&
      layer.data !== null
    ) {
      const children = (layer.data as { children?: Layer[] }).children;
      if (Array.isArray(children)) {
        yield* walkLayers(children);
      }
    }
  }
}

function extractAssetRefs(value: unknown, refs: Set<string>): void {
  if (typeof value === 'string') {
    if (value.startsWith('asset://')) {
      refs.add(value.slice('asset://'.length));
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      extractAssetRefs(item, refs);
    }
    return;
  }

  if (typeof value === 'object' && value !== null) {
    for (const entry of Object.values(value)) {
      extractAssetRefs(entry, refs);
    }
  }
}

export function collectAssetRefs(scene: Scene): Set<string> {
  const refs = new Set<string>();
  for (const page of scene.pages) {
    for (const layer of walkLayers(page.layers)) {
      extractAssetRefs(layer.data, refs);
    }
  }
  return refs;
}
