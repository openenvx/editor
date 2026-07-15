export interface SnapBounds {
  bottom: number;
  centerX: number;
  centerY: number;
  height: number;
  left: number;
  right: number;
  top: number;
  width: number;
}

export interface SnapTarget {
  bounds: SnapBounds;
  layerType: string;
}

export interface GuideLine {
  extent: [number, number];
  fullSpan?: boolean;
  orientation: 'h' | 'v';
  position: number;
}

export interface SpacingGuide {
  axis: 'x' | 'y';
  gap: number;
  labelPosition: { x: number; y: number };
  lineEnd: { x: number; y: number };
  lineStart: { x: number; y: number };
}

export interface SnapResult {
  guides: GuideLine[];
  spacing: SpacingGuide[];
  x: number;
  y: number;
}

export interface ResizeSnapResult {
  box: {
    height: number;
    rotation: number;
    width: number;
    x: number;
    y: number;
  };
  guides: GuideLine[];
  spacing: SpacingGuide[];
}
