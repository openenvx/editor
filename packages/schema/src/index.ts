export {
  BUILTIN_LAYER_TYPES,
  LAYER_WRITE_MODES,
  SCHEMA_VERSION,
  type BuiltinLayerType,
  type CanvasCircleData,
  type CanvasCircleLayer,
  type CanvasGroupData,
  type CanvasGroupLayer,
  type CanvasImageData,
  type CanvasImageLayer,
  type CanvasRectData,
  type CanvasRectLayer,
  type CanvasSvgData,
  type CanvasSvgLayer,
  type CanvasTextData,
  type CanvasTextLayer,
  type CornerRadius,
  type EditorPaneKind,
  type EditorState,
  type FocalPoint,
  type FrozenLayerSnapshot,
  type ImageFit,
  type Layer,
  type LayerBorder,
  type LayerShadow,
  type LayerStyle,
  type LayerWriteMode,
  type LengthUnit,
  type Padding,
  type Page,
  type PageLayout,
  type PluginLayer,
  type Scene,
  type SceneAsset,
  type SceneAssetInline,
  type SceneSnapshot,
  type Selection,
  type TemplatePolicy,
  type TextAutoFit,
  type Transform,
} from './types';

export { LENGTH_UNITS, defaultDpiForUnit, fromPx, toPx } from './units';

export {
  DEFAULT_PAGE_SIZE_PRESET,
  PAGE_SIZE_PRESETS,
  findPresetForPage,
  getDefaultPageDimensions,
  resolvePagePreset,
  type PageSizePreset,
} from './page-presets';

export {
  createDefaultEditorState,
  createDefaultPage,
  createDefaultTransform,
  createEmptyScene,
  createEmptySceneSnapshot,
  normalizeEditorState,
  normalizeScene,
  normalizeSceneSnapshot,
} from './normalize';

export { pruneEditorState } from './editor-state';

export {
  computePageExportDimensions,
  pagePhysicalSize,
  physicalSizeToPixels,
  resolvePageBackground,
  resolvePageDpi,
  resolvePagePixelDimensions,
  resolvePagePresetId,
  resolvePageUnit,
  type PageExportDimensions,
  type PageExportOptions,
} from './page-export';

export {
  DEFAULT_BLEED_MM,
  DEFAULT_SAFE_MM,
  computePagePrintBoxes,
  isPrintEligiblePage,
  resolvePageBleedMm,
  resolvePageSafeMm,
  type PagePrintBoxes,
  type PagePrintRect,
} from './page-print';

export {
  assertValidScene,
  parseValidEditorState,
  parseValidScene,
  parseValidSceneSnapshot,
  validateEditorState,
  validateScene,
  validateSceneSnapshot,
  type ValidateMode,
  type ValidationError,
  type ValidationResult,
} from './validate';

export {
  editorStateSchemaCanonical,
  editorStateSchemaLenient,
  layerStyleShadowSchema,
  leafSchemas,
  paddingSchema,
  sceneSchemaCanonical,
  sceneSchemaLenient,
  sceneSnapshotSchemaCanonical,
  sceneSnapshotSchemaLenient,
  transformSchema,
} from './scene-schema';

export { cloneDropNulls } from './clone-drop-nulls';

export {
  applyModifications,
  extractTemplateManifest,
  findTemplateLayerByName,
  plainTextToHtml,
  validateTemplateNames,
  type Modification,
  type TemplateField,
  type TemplateFieldKind,
  type TemplateManifest,
  type TemplateNameValidation,
} from './template';
