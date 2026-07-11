export type CanvasOverlayPrimitive =
  | {
      dashed?: boolean;
      kind: 'line';
      points: number[];
      strokeWidth?: number;
    }
  | {
      dashed?: boolean;
      height: number;
      kind: 'rect';
      strokeWidth?: number;
      width: number;
      x: number;
      y: number;
    }
  | {
      kind: 'label';
      text: string;
      x: number;
      y: number;
    };

export interface CanvasOverlayTheme {
  foreground: string;
  guideStroke: string;
  marginStroke: string;
}
