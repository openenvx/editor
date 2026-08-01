import type { LengthUnit, Transform } from '@openenvx/schema';

import type { LayerPreviewDescriptor } from './layer-preview';

export const RENDER_IR_VERSION = 1;

export const SERVER_KNOWN_PREVIEW_KINDS = [
  'rect',
  'ellipse',
  'image',
  'svg',
  'richText',
  'stack',
  'placeholder',
] as const;

export type ServerKnownPreviewKind =
  (typeof SERVER_KNOWN_PREVIEW_KINDS)[number];

export interface RenderIrAsset {
  encoding: 'base64';
  data: string;
  mimeType: string;
}

export interface RawSvgDescriptor {
  kind: 'raw';
  svg: string;
}

export interface RasterDescriptor {
  kind: 'raster';
  assetRef: string;
}

export type RenderIrDescriptor =
  | LayerPreviewDescriptor
  | RawSvgDescriptor
  | RasterDescriptor;

export interface RenderIrNode {
  id: string;
  transform: Transform;
  descriptor: RenderIrDescriptor;
}

export interface RenderIrPage {
  width: number;
  height: number;
  unit?: LengthUnit;
  dpi?: number;
  presetId?: string;
  background?: string;
  /** Bleed outside trim in millimetres (0 = no crop marks on svg/pdf). */
  bleedMm?: number;
}

export interface RenderIrDocument {
  irVersion: typeof RENDER_IR_VERSION;
  page: RenderIrPage;
  nodes: RenderIrNode[];
  assets?: Record<string, RenderIrAsset>;
}

export type IrRenderMode = 'strict' | 'lenient';

export interface IrRenderDiagnostic {
  nodeId: string;
  code: string;
  message: string;
}

export function isServerKnownPreviewKind(
  kind: string
): kind is ServerKnownPreviewKind {
  return (SERVER_KNOWN_PREVIEW_KINDS as readonly string[]).includes(kind);
}

export function isRawSvgDescriptor(
  descriptor: RenderIrDescriptor
): descriptor is RawSvgDescriptor {
  return descriptor.kind === 'raw';
}

export function isRasterDescriptor(
  descriptor: RenderIrDescriptor
): descriptor is RasterDescriptor {
  return descriptor.kind === 'raster';
}

export function isLayerPreviewDescriptor(
  descriptor: RenderIrDescriptor
): descriptor is LayerPreviewDescriptor {
  return !isRawSvgDescriptor(descriptor) && !isRasterDescriptor(descriptor);
}
