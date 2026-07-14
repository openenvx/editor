export {
  ViewportController,
  DEFAULT_VIEWPORT,
  DEFAULT_POINTER_STATE,
  adjustZoomForPageResize,
  canvasToScreen,
  computeFitZoom,
  screenToCanvas,
  hitTestLayer,
  nudgeTransform,
  type ViewportState,
  type CanvasPointerState,
} from './viewport';
export {
  hitTestRotatedLayer,
  resizeTransform,
  hitTestAxisAlignedLayer,
  MIN_LAYER_SIZE,
  clampTransformSize,
  constrainTransformerBox,
  enforceNodeTransformLimits,
  isValidNodeTransform,
  snapshotNodeState,
  applyNodeState,
  bakeNodeTransform,
  clampAnchorDragPosition,
  createTransformDragContext,
  createTransformDragContextFromOrigin,
  normalizeNodeBeforeTransform,
  pointerToParentLocal,
  type TransformDragContext,
} from './geometry';
export { getLayerBounds, type AlignBounds } from './align';
export {
  CanvasStage,
  type CanvasSelectLayerOptions,
  type CanvasStageLayer,
  type CanvasTransformChange,
} from './canvas-stage';
export type { CanvasStageProps } from './canvas-stage-types';
export {
  CanvasLayerContent,
  type CanvasLayerContentProps,
} from './canvas-layer-content';
export {
  CanvasEditor,
  useCanvasViewport,
  type CanvasEditorProps,
} from './editor/canvas-editor';
export { AbsoluteEditorPane } from './editor/absolute-editor-pane';
export { computeArtboardOffset, type ArtboardOffset } from './artboard-offset';
export { useContainerSize, type ContainerSize } from './use-container-size';
export {
  layoutRichText,
  measureRichTextHeight,
  parseRichTextHtml,
  type PositionedSpan,
  type RichTextStyle,
  type StyledSpan,
} from './rich-text-layout';
export {
  DEFAULT_RICH_TEXT_FILL,
  DEFAULT_RICH_TEXT_FONT_FAMILY,
  DEFAULT_RICH_TEXT_FONT_SIZE,
  DEFAULT_RICH_TEXT_LETTER_SPACING,
  getRichTextDomStyles,
  getRichTextLineHeight,
  type RichTextDomStyleOptions,
  RICH_TEXT_LINE_HEIGHT_MULTIPLIER,
  RICH_TEXT_OVERFLOW_WRAP,
  RICH_TEXT_WHITE_SPACE,
  RICH_TEXT_WORD_BREAK,
} from './rich-text-typography';
export { RichTextKonva, type RichTextKonvaProps } from './rich-text-konva';
export {
  bakeRichTextNodeTransform,
  MIN_RICH_TEXT_FONT_SIZE,
  RICH_TEXT_CORNER_ANCHORS,
  RICH_TEXT_ENABLED_ANCHORS,
  RICH_TEXT_HORIZONTAL_ANCHORS,
} from './rich-text-transform';
export {
  computeCornerResize,
  computeHorizontalResize,
  computeHorizontalResizeFromNode,
  constrainRichTextHorizontalBox,
  horizontalResizeBoxFromPointer,
  isRichTextHorizontalAnchor,
  type RichTextResizeSession,
} from './rich-text-resize';
export {
  boundImageCornerBox,
  IMAGE_CORNER_ANCHORS,
  IMAGE_EDGE_ANCHORS,
  isImageCornerAnchor,
  isImageEdgeAnchor,
  type ImageCornerAnchor,
  type ImageEdgeAnchor,
} from './image-resize';
export { ImageCanvasInteraction } from './interactions/image-canvas-interaction';
export { useLoadedImage } from './renderers/image-canvas-renderer';
export {
  CANVAS_FONT_CATALOG,
  CANVAS_FONT_FAMILIES,
} from './fonts/canvas-font-catalog';
export { canvasFontService } from './fonts/canvas-font-service';
export { loadCanvasFonts } from './fonts/load-canvas-fonts';
export { collectCanvasFontFamilies } from './collect-canvas-font-families';
export { useCanvasFontPreload } from './use-canvas-font-preload';
export {
  CanvasBasicsPlugin,
  createCanvasDemoScene,
  InsertCanvasTextCommand,
  InsertCanvasImageCommand,
  InsertCanvasRectCommand,
  InsertCanvasCircleCommand,
  UploadAssetCommand,
} from './plugin/canvas-basics-plugin';
export {
  ExportImageCommand,
  ResizePagePresetCommand,
  SetPagePresetCommand,
  SetPageSizeCommand,
  UpdateLayerTransformCommand,
  UpdateRichTextTransformCommand,
} from './commands/canvas-api-commands';
export { resizeAbsolutePage } from './page-resize/scale-page-content';
export {
  applyPagePresetResize,
  resizeSceneToPagePreset,
} from './page-resize/apply-page-preset-resize';
export { usePagePresetResize } from './hooks/use-page-preset-resize';
export { useCanvasClipboardService } from './hooks/use-canvas-clipboard-service';
export {
  CanvasTextLayer,
  canvasTextSchema,
  type CanvasTextModel,
} from './layers/canvas-text-layer';
export {
  CanvasImageLayer,
  canvasImageSchema,
  type CanvasImageModel,
} from './layers/canvas-image-layer';
export {
  CanvasRectLayer,
  canvasRectSchema,
  type CanvasRectModel,
} from './layers/canvas-rect-layer';
export {
  CanvasCircleLayer,
  canvasCircleSchema,
  type CanvasCircleModel,
} from './layers/canvas-circle-layer';
export {
  builtinCanvasRendererContributions,
  builtinCanvasInteractionContributions,
  builtinLayerPreviewRendererContributions,
} from './renderers/builtin-contributions';
export { LayerPreviewRenderer } from './renderers/preview/layer-preview-resolver';
export {
  PreviewRendererRegistryProvider,
  usePreviewRendererRegistry,
} from './renderers/preview/preview-renderer-context';
export {
  CanvasHostProvider,
  useCanvasHost,
  type CanvasHostApi,
} from './canvas-host-context';
export type { CanvasLayerSurfaceItem } from './layer-surface-item';
export {
  CanvasLayerRendererContribution,
  type CanvasLayerRendererHostProps,
} from './contributions/canvas-layer-renderer-contribution';
export {
  LayerPreviewRendererContribution,
  type LayerPreviewRendererHostProps,
} from './contributions/layer-preview-renderer-contribution';
export {
  CanvasLayerInteractionContribution,
  toCanvasLayerInteractionRegistration,
  type CanvasHandleDragContext,
  type CanvasHandleLayoutContext,
  type CanvasInteractionLayoutContext,
  type CanvasTransformModifiers,
  type HandleDescriptor,
  type CanvasTransformBox,
  type CanvasTransformContext,
  type CanvasTransformResult,
} from './contributions/canvas-layer-interaction-contribution';
export {
  unionCanvasRects,
  type CanvasDragAdjustInput,
  type CanvasDragAdjustResult,
  type CanvasLayerTransformRef,
  type CanvasOverlayBuildContext,
  type CanvasRect,
  type CanvasResizeAdjustInput,
  type CanvasResizeAdjustResult,
  type CanvasStageInteractionService,
} from './stage/canvas-stage-interaction';
export type { CanvasOverlayPrimitive } from './stage/canvas-overlay-primitives';
export {
  registerCanvasContribution,
  createCanvasRegistriesService,
  ensureCanvasRegistriesInstalled,
  type CanvasContribution,
  type RegisterCanvasContributionOptions,
} from './plugin/canvas-registry-service';
export { useCanvasApi } from './hooks/use-canvas-api';
export { useCanvasRegistries } from './hooks/use-canvas-registries';
export { useCanvasStageInteraction } from './hooks/use-canvas-stage-interaction';
export {
  CanvasClipboardServiceId,
  CanvasCommandRequestServiceId,
  CanvasFontServiceId,
  CanvasPageResizeServiceId,
  CanvasRegistriesServiceId,
  CanvasStageInteractionServiceId,
} from './canvas-service-tokens';
export {
  CanvasDocumentExportServiceId,
  type CanvasDocumentExportService,
  type CanvasExportDimensions,
  type CanvasExportFallback,
  type CanvasExportFormat,
  type CanvasExportOptions,
  type CanvasExportResult,
  type CanvasPreviewSvgSerializer,
} from './export/canvas-document-export-service';
export { bytesToDataUrl, downloadBytes } from './export/bytes-to-data-url';
export type { PageResizeService } from './page-resize/page-resize-types';
export type {
  CanvasRegistriesReader,
  CanvasRegistriesSnapshot,
} from './registry/canvas-registries-reader';
export type {
  CanvasLayerInteractionRegistration,
  CanvasLayerRendererRegistration,
  LayerPreviewRendererRegistration,
} from './registry/canvas-registry-types';
