/**
 * Hand-written Scene document types.
 * Leaf field shapes match Zod inference; recursive Layer / Page / Scene are
 * authored here because Zod cannot cleanly infer the recursive group type.
 */

export const SCHEMA_VERSION = 2;

export type PageLayout = 'flow' | 'absolute';

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
  'canvas.text',
  'canvas.circle',
  'canvas.group',
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

export interface CanvasImageData {
  assetRef: string;
  alt?: string;
  [key: string]: unknown;
}

export interface CanvasTextData {
  html: string;
  align?: 'left' | 'center' | 'right';
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
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
  locked?: boolean;
  /** When false, the layer is hidden on canvas and in export. Absent/true = visible. */
  visible?: boolean;
}

export interface CanvasRectLayer extends LayerBase {
  type: 'canvas.rect';
  data: CanvasRectData;
}

export interface CanvasImageLayer extends LayerBase {
  type: 'canvas.image';
  data: CanvasImageData;
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

/** Unknown plugin layer — structural fields validated; data opaque. */
export interface PluginLayer extends LayerBase {
  type: string;
  data: unknown;
}

export type Layer =
  | CanvasRectLayer
  | CanvasImageLayer
  | CanvasTextLayer
  | CanvasCircleLayer
  | CanvasGroupLayer
  | PluginLayer;

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
  /** Artboard background used for document export. */
  backgroundColor?: string;
  layers: Layer[];
}

/**
 * Editor UI state — not part of the content Scene consumed by LLMs/SDKs.
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

/** Content-only design document (no editor UI state). */
export interface Scene {
  schemaVersion: number;
  pages: Page[];
  assets?: Record<string, SceneAsset>;
  templatePolicy?: TemplatePolicy;
}

/** Persisted / transferable document: content + editor UI state. */
export interface SceneSnapshot {
  scene: Scene;
  editorState: EditorState;
}

export type EditorPaneKind = PageLayout | string;
