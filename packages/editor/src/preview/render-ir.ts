/**
 * @deprecated Use `./render-document` types. Kept for export stability during migration.
 */
export {
  type CompileDiagnostic as IrRenderDiagnostic,
  type RenderDocument as RenderIrDocument,
  type RenderNode as RenderIrNode,
} from './render-document';

export {
  RENDER_IR_VERSION,
  SERVER_KNOWN_PREVIEW_KINDS,
} from './render-ir-legacy';

export type {
  IrRenderMode,
  RasterDescriptor,
  RawSvgDescriptor,
  RenderIrAsset,
  RenderIrDescriptor,
  RenderIrPage,
  ServerKnownPreviewKind,
} from './render-ir-legacy';

export {
  isLayerPreviewDescriptor,
  isRasterDescriptor,
  isRawSvgDescriptor,
  isServerKnownPreviewKind,
} from './render-ir-legacy';
