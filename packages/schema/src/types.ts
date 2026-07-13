export const SCHEMA_VERSION = 1;

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

export interface Layer {
  id: string;
  type: string;
  data: unknown;
  transform?: Transform;
  style?: LayerStyle;
  writeMode?: LayerWriteMode;
  locked?: boolean;
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
  /** Artboard background used for document export. */
  backgroundColor?: string;
  layers: Layer[];
}

export interface Selection {
  activePageId: string;
  selectedLayerIds: string[];
  primaryLayerId: string | null;
}

export interface SceneAssetInline {
  mimeType: string;
  encoding: 'base64';
  data: string;
}

export type SceneAsset = SceneAssetInline;

export interface Scene {
  schemaVersion: number;
  pages: Page[];
  activePageId: string;
  selection: Selection;
  assets?: Record<string, SceneAsset>;
  templatePolicy?: TemplatePolicy;
}

export interface SceneSnapshot {
  scene: Scene;
}

export type EditorPaneKind = PageLayout | string;
