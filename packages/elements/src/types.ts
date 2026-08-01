export type CanvasElementType =
  | 'Group'
  | 'Stack'
  | 'Grid'
  | 'Text'
  | 'Rect'
  | 'Ellipse'
  | 'Image'
  | 'SVG'
  | 'QR'
  | 'Layer'
  | 'Instance';

export type HtmlElementType =
  | 'Section'
  | 'Row'
  | 'Column'
  | 'Heading'
  | 'Paragraph'
  | 'Button'
  | 'Image'
  | 'Divider'
  | 'Html'
  | 'Block';

export type WidgetElementType = CanvasElementType | HtmlElementType;

export type StackDirection = 'horizontal' | 'vertical';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface StackProps {
  direction?: StackDirection;
  spacing?: number;
  gap?: number;
  padding?:
    | number
    | { top?: number; right?: number; bottom?: number; left?: number };
  wrap?: boolean;
  horizontalAlignItems?: StackAlign;
  verticalAlignItems?: StackAlign;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  onClick?: (payload?: unknown) => void;
  children?: unknown;
}

export interface TextProps {
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right';
  width?: number;
  height?: number;
  /** Bind committed inline edits back to a values key. */
  bind?: string;
  onClick?: unknown;
  children?: unknown;
  value?: string;
}

export interface RectangleProps {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
}

export interface EllipseProps {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface ImageProps {
  src?: string;
  assetRef?: string;
  alt?: string;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill';
  bind?: string;
}

export interface SvgProps {
  svg: string;
  width?: number;
  height?: number;
  fill?: string;
}

export interface QrProps {
  value: string;
  width?: number;
  height?: number;
  foreground?: string;
  background?: string;
}

export interface LayerByNameProps {
  type: string;
  data?: Record<string, unknown>;
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export interface InstanceProps {
  componentId: string;
  overrides?: Record<string, Record<string, unknown>>;
  width?: number;
  height?: number;
}

/** Intent emitted for host-side layout (not absolute positions yet). */
export interface LayoutIntent {
  kind: 'autoLayout' | 'grid';
  direction: StackDirection;
  spacing: number;
  padding: { top: number; right: number; bottom: number; left: number };
  wrap: boolean;
  horizontalAlignItems: StackAlign;
  verticalAlignItems: StackAlign;
  columns?: number;
}
