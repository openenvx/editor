export {
  BUILTIN_NODE_TYPES,
  clampTextCurve,
  MAX_TEXT_CURVE,
  NODE_WRITE_MODES,
  type LengthUnit,
  type CanvasCircleProps,
  type CanvasImageProps,
  type CanvasInstanceProps,
  type CanvasQrProps,
  type CanvasRectProps,
  type CanvasSvgProps,
  type CanvasTextProps,
  type OpenEnvxWidgetProps,
  type Artboard,
  type ArtboardGuide,
  type ArtboardGuideOrientation,
  type ArtboardPhysical,
  type ArtboardSpace,
  type BuiltinNodeType,
  type CornerRadius,
  type Document,
  type DocumentAsset,
  type DocumentAssetInline,
  type DocumentComponent,
  type DocumentNode,
  type EditorPaneKind,
  type EditorSession,
  type EditorSurfaceKind,
  type FocalPoint,
  type Frame,
  type FrozenNodeSnapshot,
  type ImageFit,
  type NodeBorder,
  type NodeShadow,
  type NodeStyle,
  type NodeWriteMode,
  type Padding,
  type ProjectSnapshot,
  type QrErrorCorrection,
  type TemplatePolicy,
  type TemplateVariable,
  type TextAutoFit,
  type Transform,
  type WidgetFieldDef,
  type WidgetManifestSnapshot,
} from './types';

export {
  applyNodeTransform,
  defaultFrame,
  defaultTransform,
  getChildNodes,
  hasChildNodes,
  nodeProps,
  nodeTransform,
} from './node-helpers';

export { legacyTestLayer, type LegacyTestLayerInput } from './legacy-test-node';

export {
  migrateLegacyLayerInput,
  type LegacyLayerInput,
} from './legacy-document-migration';

export {
  artboardRulesLayout,
  artboardSpaceSize,
  DEFAULT_ARTBOARD_RULES_LAYOUT_KEY,
  withArtboardRulesLayout,
} from './artboard-helpers';

export { LENGTH_UNITS, defaultDpiForUnit, fromPx, toPx } from './units';

export {
  createDefaultArtboard,
  createDefaultEditorSession,
  createDefaultFrame,
  createEmptyDocument,
  createEmptyProjectSnapshot,
  normalizeDocument,
  normalizeEditorSession,
  normalizeProjectSnapshot,
} from './normalize';

export { pruneEditorSession } from './editor-state';

export {
  computeArtboardExportDimensions,
  artboardPhysicalSize,
  physicalSizeToPixels,
  resolveArtboardBackground,
  resolveArtboardDpi,
  resolveArtboardPixelDimensions,
  resolveArtboardPresetId,
  resolveArtboardUnit,
  type ArtboardExportDimensions,
  type ArtboardExportOptions,
} from './page-export';

export {
  DEFAULT_BLEED_MM,
  DEFAULT_SAFE_MM,
  computeArtboardPrintBoxes,
  isPrintEligibleArtboard,
  resolveArtboardBleedMm,
  resolveArtboardSafeMm,
  type ArtboardPrintBoxes,
  type ArtboardPrintRect,
} from './page-print';

export {
  assertValidDocument,
  parseValidDocument,
  parseValidEditorSession,
  parseValidProjectSnapshot,
  validateDocument,
  validateEditorSession,
  validateProjectSnapshot,
  type ValidateMode,
  type ValidationError,
  type ValidationResult,
} from './validate';

export {
  documentSchemaCanonical,
  documentSchemaLenient,
  editorSessionSchemaCanonical,
  editorSessionSchemaLenient,
  frameSchema,
  leafSchemas,
  nodeStyleShadowSchema,
  paddingSchema,
  projectSnapshotSchemaCanonical,
  projectSnapshotSchemaLenient,
} from './document-schema';

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

export {
  applyTemplateVariables,
  applyTemplateVariablesForPreview,
  addVariableToDocument,
  buildSampleVariableValues,
  createVariableId,
  extractVariableKeys,
  formatVariableToken,
  isValidVariableKey,
  listVariableUsages,
  nextVariableKey,
  removeVariableFromDocument,
  reorderVariablesInDocument,
  resolvePrimaryTextPropPath,
  resolveVariableChipPresentation,
  rewriteVariableKeyInDocument,
  documentVariables,
  updateVariableInDocument,
  validateVariableKeyForCatalog,
  variableHasFallback,
  VARIABLE_CHIP_CLASS,
  VARIABLE_CHIP_MISSING_CLASS,
  VARIABLE_CHIP_TIP_CLASS,
  VARIABLE_TOKEN_CAPTURE_RE,
  wrapVariableTokensForDisplay,
  type VariableChipPresentation,
  type VariableKeyValidationReason,
  type WrapVariableTokensOptions,
} from './template-variables';
