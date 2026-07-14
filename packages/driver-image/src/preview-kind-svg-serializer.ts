import type { LayerRegistry } from '@openenvx/core';
import type { LayerPreviewDescriptor } from '@openenvx/preview';
import type { Layer, Scene } from '@openenvx/schema';

export interface SvgBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SvgSerializeContext {
  scene: Scene;
  pageId: string;
  layer: Layer;
  bounds: SvgBounds;
  layerRegistry: LayerRegistry;
  resolveAsset: (ref: string) => string;
  useRichText: boolean;
  serializeDescriptor: (
    descriptor: LayerPreviewDescriptor,
    ctx: SvgSerializeContext
  ) => string;
}

export interface PreviewKindSvgSerializer {
  readonly kind: string;
  toSvgFragment(
    descriptor: LayerPreviewDescriptor,
    ctx: SvgSerializeContext
  ): string;
}

export interface PreviewKindSvgSerializerRegisterOptions {
  override?: boolean;
}

export class PreviewKindSvgSerializerRegistry {
  private readonly serializers = new Map<string, PreviewKindSvgSerializer>();

  register(
    serializer: PreviewKindSvgSerializer,
    options?: PreviewKindSvgSerializerRegisterOptions
  ): void {
    if (this.serializers.has(serializer.kind) && !options?.override) {
      throw new Error(
        `Preview SVG serializer already registered: ${serializer.kind}`
      );
    }
    this.serializers.set(serializer.kind, serializer);
  }

  get(kind: string): PreviewKindSvgSerializer | undefined {
    return this.serializers.get(kind);
  }
}

let defaultRegistry: PreviewKindSvgSerializerRegistry | undefined;

export function getDefaultSerializerRegistry(): PreviewKindSvgSerializerRegistry {
  if (!defaultRegistry) {
    defaultRegistry = new PreviewKindSvgSerializerRegistry();
  }
  return defaultRegistry;
}
