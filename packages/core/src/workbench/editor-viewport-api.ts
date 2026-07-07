/** Opaque viewport control surface for editor panes (no Konva/canvas types in core). */
export interface EditorViewportApi {
  zoomIn(): void;
  zoomOut(): void;
  zoomToFit(): void;
  zoomTo100(): void;
  reset(): void;
  getZoomPercent(): number;
}
