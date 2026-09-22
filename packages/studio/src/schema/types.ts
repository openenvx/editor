/**
 * Hand-written document types.
 * Leaf prop shapes match Zod inference; recursive DocumentNode / Artboard /
 * Document are authored here because Zod cannot cleanly infer the recursive type.
 */

export type LengthUnit = 'px' | 'mm' | 'in' | 'cm' | 'pt';

export interface NodeBorder {
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

export interface NodeShadow {
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: string;
}

export interface NodeStyle {
  padding?: Padding;
  cornerRadius?: CornerRadius;
  border?: NodeBorder;
  shadow?: NodeShadow;
  fill?: string;
  flipH?: boolean;
  flipV?: boolean;
}

/** Logical placement box on the artboard (no opacity / scale). */
export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/** Full transform used by canvas geometry (frame + opacity + scale). */
export interface Transform extends Frame {
  opacity: number;
  scaleX?: number;
  scaleY?: number;
}

export const NODE_WRITE_MODES = [
  'locked',
  'free',
  'content',
  'properties',
] as const;

export type NodeWriteMode = (typeof NODE_WRITE_MODES)[number];

/** @deprecated use NODE_WRITE_MODES */
export const LAYER_WRITE_MODES = NODE_WRITE_MODES;

/** @deprecated use NodeWriteMode */
export type LayerWriteMode = NodeWriteMode;

export const BUILTIN_NODE_TYPES = [
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

export type BuiltinNodeType = (typeof BUILTIN_NODE_TYPES)[number];

/** @deprecated use BUILTIN_NODE_TYPES */
export const BUILTIN_LAYER_TYPES = BUILTIN_NODE_TYPES;

/** @deprecated use BuiltinNodeType */
export type BuiltinLayerType = BuiltinNodeType;

export interface FrozenNodeSnapshot {
  props?: unknown;
  frame?: Frame;
}

/** @deprecated use FrozenNodeSnapshot */
export type FrozenLayerSnapshot = FrozenNodeSnapshot;

export interface TemplatePolicy {
  version: 1;
  allowInsertLayers: boolean;
  allowDeleteLayers: boolean;
  allowDuplicateLayers: boolean;
  allowArtboardResize: boolean;
  frozenNodes?: Record<string, FrozenNodeSnapshot>;
}

export interface CanvasRectProps {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: CornerRadius;
  padding?: Padding;
  shadow?: NodeShadow;
  flipH?: boolean;
  flipV?: boolean;
}

/** @deprecated use CanvasRectProps */
export type CanvasRectData = CanvasRectProps;

export type ImageFit = 'cover' | 'contain' | 'fill';

export interface FocalPoint {
  x: number;
  y: number;
}

export interface CanvasImageProps {
  assetRef: string;
  alt?: string;
  fit?: ImageFit;
  focalPoint?: FocalPoint;
  [key: string]: unknown;
}

/** @deprecated use CanvasImageProps */
export type CanvasImageData = CanvasImageProps;

export interface CanvasSvgProps {
  svg: string;
  viewBox?: string;
  fill?: string;
  stroke?: string;
}

/** @deprecated use CanvasSvgProps */
export type CanvasSvgData = CanvasSvgProps;

export type QrErrorCorrection = 'L' | 'M' | 'Q' | 'H';

export interface CanvasQrProps {
  url: string;
  foreground?: string;
  background?: string;
  errorCorrection?: QrErrorCorrection;
  margin?: number;
}

/** @deprecated use CanvasQrProps */
export type CanvasQrData = CanvasQrProps;

export type TextAutoFit = 'none' | 'shrink' | 'hug';

export const MAX_TEXT_CURVE = 100;

export function clampTextCurve(curve: number): number {
  return Math.max(-MAX_TEXT_CURVE, Math.min(MAX_TEXT_CURVE, curve));
}

export interface CanvasTextProps {
  html: string;
  align?: 'left' | 'center' | 'right';
  curve?: number;
  fill?: string;
  fontFamily?: string;
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  autoFit?: TextAutoFit;
  minFontSize?: number;
}

/** @deprecated use CanvasTextProps */
export type CanvasTextData = CanvasTextProps;

export interface CanvasCircleProps {
  fill: string;
  stroke?: string;
  strokeWidth?: number;
}

/** @deprecated use CanvasCircleProps */
export type CanvasCircleData = CanvasCircleProps;

export interface DocumentNode {
  id: string;
  type: string;
  name?: string;
  frame?: Frame;
  props?: Record<string, unknown>;
  children?: DocumentNode[];
  opacity?: number;
  scaleX?: number;
  scaleY?: number;
  style?: NodeStyle;
  writeMode?: NodeWriteMode;
  allowedPropKeys?: string[];
  locked?: boolean;
  visible?: boolean;
  showInLayers?: boolean;
}

/** @deprecated use DocumentNode */
export type Layer = DocumentNode;

export interface DocumentComponent {
  id: string;
  name?: string;
  nodes: DocumentNode[];
}

/** @deprecated use DocumentComponent */
export type SceneComponent = DocumentComponent;

export interface CanvasInstanceProps {
  componentId: string;
  overrides?: Record<string, Record<string, unknown>>;
}

/** @deprecated use CanvasInstanceProps */
export type CanvasInstanceData = CanvasInstanceProps;

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

export interface WidgetManifestSnapshot {
  id: string;
  label: string;
  icon?: string;
  kinds: ('canvas' | 'html')[];
  fields: Record<string, WidgetFieldDef>;
  defaults?: Record<string, unknown>;
}

export interface OpenEnvxWidgetProps {
  extensionId: string;
  values: Record<string, unknown>;
  manifest?: WidgetManifestSnapshot;
  handlers?: Record<string, Record<string, string>>;
  label?: string;
}

/** @deprecated use OpenEnvxWidgetProps */
export type OpenEnvxWidgetData = OpenEnvxWidgetProps;

export type ArtboardGuideOrientation = 'horizontal' | 'vertical';

/** @deprecated use ArtboardGuideOrientation */
export type PageGuideOrientation = ArtboardGuideOrientation;

export interface ArtboardGuide {
  id: string;
  orientation: ArtboardGuideOrientation;
  position: number;
}

/** @deprecated use ArtboardGuide */
export type PageGuide = ArtboardGuide;

export interface ArtboardSpace {
  width?: number;
  height?: number;
}

export interface ArtboardPhysical {
  unit?: LengthUnit;
  dpi?: number;
  presetId?: string;
  bleedMm?: number;
  safeMm?: number;
}

export interface Artboard {
  id: string;
  name: string;
  space: ArtboardSpace;
  physical?: ArtboardPhysical;
  background?: string;
  guides?: ArtboardGuide[];
  nodes: DocumentNode[];
  extensions?: Record<string, unknown>;
}

/** @deprecated use Artboard */
export type Page = Artboard;

export interface EditorSession {
  activeArtboardId: string;
  selectedNodeIds: string[];
  primaryNodeId: string | null;
}

/** @deprecated use EditorSession */
export type EditorState = EditorSession;

/** @deprecated use EditorSession */
export type Selection = EditorSession;

export interface DocumentAssetInline {
  mimeType: string;
  encoding: 'base64';
  data: string;
}

export type DocumentAsset = DocumentAssetInline;

/** @deprecated use DocumentAsset */
export type SceneAsset = DocumentAsset;

/** @deprecated use DocumentAssetInline */
export type SceneAssetInline = DocumentAssetInline;

export interface TemplateVariable {
  id: string;
  key: string;
  sample?: string;
}

export interface Document {
  artboards: Artboard[];
  assets?: Record<string, DocumentAsset>;
  components?: Record<string, DocumentComponent>;
  templatePolicy?: TemplatePolicy;
  variables?: TemplateVariable[];
}

/** @deprecated use Document */
export type Scene = Document;

export interface ProjectSnapshot {
  document: Document;
  session: EditorSession;
}

/** @deprecated use ProjectSnapshot */
export interface SceneSnapshot {
  scene: Document;
  editorState: EditorSession;
}

export type EditorPaneKind = string;
export type EditorSurfaceKind = string;

/** @deprecated provider-defined layout string */
export type PageLayout = string;

/** @deprecated use NodeBorder */
export type LayerBorder = NodeBorder;

/** @deprecated use NodeShadow */
export type LayerShadow = NodeShadow;

/** @deprecated use NodeStyle */
export type LayerStyle = NodeStyle;
