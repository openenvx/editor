/**
 * Hand-written Scene document types.
 * Leaf field shapes match Zod inference; recursive Layer / Page / Scene are
 * authored here because Zod cannot cleanly infer the recursive group type.
 */

export const SCHEMA_VERSION = 4;

/** Provider-defined page layout / editor-pane kind (e.g. `'absolute'`, `'html'`). */
export type PageLayout = string;

export type LengthUnit = 'px' | 'mm' | 'in' | 'cm' | 'pt';

export interface LayerBorder {
  width: number;
  color: string;
}

export interface CornerRadius {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface Padding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface LayerShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

export interface LayerStyle {
  padding?: Padding;
  cornerRadius?: CornerRadius;
  border?: LayerBorder;
  shadow?: LayerShadow;
  fill?: string;
  flipH?: boolean;
  flipV?: boolean;
}

export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX?: number;
  scaleY?: number;
}

export const LAYER_WRITE_MODES = [
  'locked',
  'free',
  'content',
  'properties',
] as const;

export type LayerWriteMode = (typeof LAYER_WRITE_MODES)[number];

export const BUILTIN_LAYER_TYPES = [
  'canvas.rect',
  'canvas.image',
  'canvas.svg',
  'canvas.qr',
  'canvas.text',
  'canvas.circle',
  'canvas.group',
  'canvas.instance',
  'openenvx.widget',
] as const;

export type BuiltinLayerType = (typeof BUILTIN_LAYER_TYPES)[number];

export interface FrozenLayerSnapshot {
  data?: unknown;
  transform?: Transform;
}

export interface TemplatePolicy {
  version: 1;
  allowInsertLayers: boolean;
  allowDeleteLayers: boolean;
  allowDuplicateLayers: boolean;
  allowPageResize: boolean;
  frozenLayers?: Record<string, FrozenLayerSnapshot>;
}

export interface CanvasRectData {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: CornerRadius;
  padding?: Padding;
  shadow?: LayerShadow;
  flipH?: boolean;
  flipV?: boolean;
}

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface FocalPoint {
  /** Horizontal focus in the source image, 0 = left, 1 = right. */
  x: number;
  /** Vertical focus in the source image, 0 = top, 1 = bottom. */
  y: number;
}

export interface CanvasImageData {
  assetRef: string;
  alt?: string;
  /**
   * How the image fills its transform box.
   * Absent = legacy stretch (`fill`). Prefer `cover` for templates.
   */
  fit?: ImageFit;
  /** Focus used when `fit` is `cover` (defaults to center). */
  focalPoint?: FocalPoint;
  [key: string]: unknown;
}

export interface CanvasSvgData {
  /** Full SVG markup (`<svg>…</svg>`) or inner vector markup. */
  svg: string;
  /** Optional viewBox; when absent, parsed from the svg root if present. */
  viewBox?: string;
  /** Optional tint for monochrome icons (e.g. currentColor icons). */
  fill?: string;
  stroke?: string;
}

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface CanvasQrData {
  /** Payload encoded into the QR (usually a URL). */
  url: string;
  foreground?: string;
  background?: string;
  errorCorrection?: QrErrorCorrection;
  /** Quiet-zone modules around the code. */
  margin?: number;
}

export type TextAutoFit = 'none' | 'shrink';

/** Slider / schema range for `CanvasTextData.curve` (unitless power, not degrees). */
export const MAX_TEXT_CURVE = 100;

export function clampTextCurve(curve: number): number {
  return Math.max(-MAX_TEXT_CURVE, Math.min(MAX_TEXT_CURVE, curve));
}

export interface CanvasTextData {
  html: string;
  align?: 'left' | 'center' | 'right';
  /**
   * Curve amount (−100…100); 0 = straight, positive = arch (sides down),
   * negative = bowl (center down). Out-of-range values are clamped on normalize.
   */
  curve?: number;
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  /**
   * When `shrink`, font size scales down (to `minFontSize`) so text stays
   * inside the fixed transform box. `fontSize` is the maximum / starting size.
   */
  autoFit?: TextAutoFit;
  /** Minimum font size used by shrink-to-fit. Defaults to 8. */
  minFontSize?: number;
}

export interface CanvasCircleData {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface CanvasGroupData {
  children: Layer[];
}

export interface LayerBase {
  id: string;
  /** Optional display name in the layers tree. Absent/empty falls back to type label. */
  name?: string;
  transform?: Transform;
  style?: LayerStyle;
  writeMode?: LayerWriteMode;
  /**
   * When `writeMode` is `content`, optional allowlist of `data` keys that may be
   * edited. Absent/empty means all data keys are editable.
   */
  allowedDataKeys?: string[];
  locked?: boolean;
  /** When false, the layer is hidden on canvas and in export. Absent/true = visible. */
  visible?: boolean;
  /**
   * When false, embed consumers omit the layer from the Layers tree and cannot
   * select it on canvas. Still renders and exports. Absent/true = listed.
   * Authors always see and select the layer (template policy not enforced).
   */
  showInLayers?: boolean;
}

export interface CanvasRectLayer extends LayerBase {
  type: 'canvas.rect';
  data: CanvasRectData;
}

export interface CanvasImageLayer extends LayerBase {
  type: 'canvas.image';
  data: CanvasImageData;
}

export interface CanvasSvgLayer extends LayerBase {
  type: 'canvas.svg';
  data: CanvasSvgData;
}

export interface CanvasQrLayer extends LayerBase {
  type: 'canvas.qr';
  data: CanvasQrData;
}

export interface CanvasTextLayer extends LayerBase {
  type: 'canvas.text';
  data: CanvasTextData;
}

export interface CanvasCircleLayer extends LayerBase {
  type: 'canvas.circle';
  data: CanvasCircleData;
}

export interface CanvasGroupLayer extends LayerBase {
  type: 'canvas.group';
  data: CanvasGroupData;
}

/** One-way symbol definition: layers are relative to the instance transform. */
export interface SceneComponent {
  id: string;
  name?: string;
  layers: Layer[];
}

export interface CanvasInstanceData {
  componentId: string;
  /** Optional shallow data overrides keyed by definition layer id. */
  overrides?: Record<string, Record<string, unknown>>;
}

export interface CanvasInstanceLayer extends LayerBase {
  type: 'canvas.instance';
  data: CanvasInstanceData;
}

/** Field def persisted on a widget layer for Inspector without the source. */
export type WidgetFieldDef =
  | { kind: string; label: string }
  | {
      kind: 'select';
      label: string;
      options: { label: string; value: string }[];
    }
  | {
      kind: 'repeater';
      label: string;
      of: Record<string, WidgetFieldDef>;
    };

/** Manifest snapshot stored on the widget so Inspector works offline. */
export interface WidgetManifestSnapshot {
  id: string;
  label: string;
  icon?: string;
  kinds: ('canvas' | 'html')[];
  fields: Record<string, WidgetFieldDef>;
  defaults?: Record<string, unknown>;
}

/**
 * Sandbox widget on the canvas/HTML page.
 * `values` is the synced state / Unlayer options bag; `children` is the last
 * rendered face (hidden from Layers, locked for editing).
 */
export interface OpenEnvxWidgetData {
  extensionId: string;
  values: Record<string, unknown>;
  manifest?: WidgetManifestSnapshot;
  children: Layer[];
  /**
   * Face event handlers: child layer id → event name → isolate handler id.
   * e.g. `{ "w1:0": { click: "h1" } }`
   */
  handlers?: Record<string, Record<string, string>>;
  label?: string;
}

export interface OpenEnvxWidgetLayer extends LayerBase {
  type: 'openenvx.widget';
  data: OpenEnvxWidgetData;
}

/** Unknown plugin layer - structural fields validated; data opaque. */
export interface PluginLayer extends LayerBase {
  type: string;
  data: unknown;
}

export type Layer =
  | CanvasRectLayer
  | CanvasImageLayer
  | CanvasSvgLayer
  | CanvasQrLayer
  | CanvasTextLayer
  | CanvasCircleLayer
  | CanvasGroupLayer
  | CanvasInstanceLayer
  | OpenEnvxWidgetLayer
  | PluginLayer;

export type PageGuideOrientation = 'horizontal' | 'vertical';

/** User-placed ruler guide on a page (artboard pixels). */
export interface PageGuide {
  id: string;
  orientation: PageGuideOrientation;
  /** Position in artboard pixels (x for vertical, y for horizontal). */
  position: number;
}

export interface Page {
  id: string;
  name: string;
  width?: number;
  height?: number;
  layout: PageLayout;
  unit?: LengthUnit;
  dpi?: number;
  /** ISO page preset id when the page matches a known preset. */
  presetId?: string;
  /**
   * Bleed outside trim, in millimetres. When unset, print-eligible pages
   * default to 3 mm and other pages to 0.
   */
  bleedMm?: number;
  /**
   * Safe/content inset inside trim, in millimetres. When unset, print-eligible
   * pages default to 10 mm and other pages to 0.
   */
  safeMm?: number;
  /** Artboard background used for document export. */
  backgroundColor?: string;
  /** User-placed ruler guides (persisted; undoable via scene history). */
  guides?: PageGuide[];
  layers: Layer[];
}

/**
 * Editor UI state - not part of the content Scene consumed by LLMs/SDKs.
 * Persisted alongside Scene in SceneSnapshot.
 */
export interface EditorState {
  activePageId: string;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
}

/** Alias used by workbench selection APIs. */
export type Selection = EditorState;

export interface SceneAssetInline {
  mimeType: string;
  encoding: 'base64';
  data: string;
}

export type SceneAsset = SceneAssetInline;

/** Catalog entry for `{{{key}}}` merge-style tokens in layer data strings. */
export interface TemplateVariable {
  id: string;
  /** Token id - `[A-Za-z][A-Za-z0-9_]*`. */
  key: string;
  label?: string;
  /** Editor preview / default render value. */
  sample?: string;
}

/** Content-only design document (no editor UI state). */
export interface Scene {
  schemaVersion: number;
  pages: Page[];
  assets?: Record<string, SceneAsset>;
  /** Reusable layer trees referenced by `canvas.instance` layers. */
  components?: Record<string, SceneComponent>;
  templatePolicy?: TemplatePolicy;
  /** Per-template variable catalog for inline `{{{key}}}` tokens. */
  variables?: TemplateVariable[];
}

/** Persisted / transferable document: content + editor UI state. */
export interface SceneSnapshot {
  scene: Scene;
  editorState: EditorState;
}

export type EditorPaneKind = string;
