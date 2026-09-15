import type { Transform } from '@openenvx/core/schema';

import { computeArtboardOffset } from './artboard-offset';

export interface ViewportState {
  panX: number;
  panY: number;
  zoom: number;
}

export interface CanvasPointerState {
  activeTool: 'select' | 'pan' | 'text' | 'rect';
}

export const DEFAULT_VIEWPORT: ViewportState = {
  panX: 0,
  panY: 0,
  zoom: 1,
};

export const DEFAULT_POINTER_STATE: CanvasPointerState = {
  activeTool: 'select',
};

export function screenToCanvas(
  screenX: number,
  screenY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom,
  };
}

export function canvasToScreen(
  canvasX: number,
  canvasY: number,
  viewport: ViewportState
): { x: number; y: number } {
  return {
    x: canvasX * viewport.zoom + viewport.panX,
    y: canvasY * viewport.zoom + viewport.panY,
  };
}

export function hitTestLayer(
  point: { x: number; y: number },
  transform: Transform
): boolean {
  const { x, y, width, height } = transform;
  return (
    point.x >= x &&
    point.x <= x + width &&
    point.y >= y &&
    point.y <= y + height
  );
}

export function nudgeTransform(
  transform: Transform,
  dx: number,
  dy: number
): Transform {
  return {
    ...transform,
    x: transform.x + dx,
    y: transform.y + dy,
  };
}

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;
const DEFAULT_FIT_PADDING = 48;

/** Exponential wheel-zoom rate (per pixel of normalized deltaY). Higher = faster. */
const WHEEL_ZOOM_SENSITIVITY = 0.01;

const WHEEL_DELTA_LINE_PIXELS = 16;

export interface ArtboardLayout {
  artboardHeight: number;
  artboardWidth: number;
  containerHeight: number;
  containerWidth: number;
}

export function normalizeWheelDeltaY(
  deltaY: number,
  deltaMode: number,
  containerHeight: number
): number {
  if (deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return deltaY * WHEEL_DELTA_LINE_PIXELS;
  }
  if (deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return deltaY * containerHeight;
  }
  return deltaY;
}

export function computeWheelZoom(
  currentZoom: number,
  normalizedDeltaY: number,
  sensitivity = WHEEL_ZOOM_SENSITIVITY
): number {
  const factor = Math.exp(-normalizedDeltaY * sensitivity);
  return Math.max(MIN_ZOOM, Math.min(currentZoom * factor, MAX_ZOOM));
}

export function isWheelZoomGesture(
  ctrlKey: boolean,
  deltaMode: number
): boolean {
  return ctrlKey || deltaMode === WheelEvent.DOM_DELTA_LINE;
}

export function computeFitZoom(
  containerWidth: number,
  containerHeight: number,
  artboardWidth: number,
  artboardHeight: number,
  padding = DEFAULT_FIT_PADDING
): number {
  if (
    containerWidth <= 0 ||
    containerHeight <= 0 ||
    artboardWidth <= 0 ||
    artboardHeight <= 0
  ) {
    return 1;
  }
  const scaleX = (containerWidth - padding * 2) / artboardWidth;
  const scaleY = (containerHeight - padding * 2) / artboardHeight;
  return Math.max(MIN_ZOOM, Math.min(scaleX, scaleY, MAX_ZOOM));
}

export function adjustZoomForPageResize(
  currentZoom: number,
  oldArtboardWidth: number,
  oldArtboardHeight: number,
  newArtboardWidth: number,
  newArtboardHeight: number,
  containerWidth: number,
  containerHeight: number,
  padding = DEFAULT_FIT_PADDING
): number {
  if (
    oldArtboardWidth <= 0 ||
    oldArtboardHeight <= 0 ||
    newArtboardWidth <= 0 ||
    newArtboardHeight <= 0
  ) {
    return currentZoom;
  }

  const fitZoom = computeFitZoom(
    containerWidth,
    containerHeight,
    newArtboardWidth,
    newArtboardHeight,
    padding
  );
  const sizeRatio = Math.sqrt(
    (newArtboardWidth / oldArtboardWidth) *
      (newArtboardHeight / oldArtboardHeight)
  );
  const targetZoom = currentZoom * sizeRatio;

  return Math.max(MIN_ZOOM, Math.min(targetZoom, fitZoom, MAX_ZOOM));
}

export class ViewportController {
  private viewport: ViewportState = { ...DEFAULT_VIEWPORT };

  getViewport(): ViewportState {
    return { ...this.viewport };
  }

  setZoom(zoom: number): void {
    this.viewport = {
      ...this.viewport,
      zoom: Math.max(MIN_ZOOM, Math.min(zoom, MAX_ZOOM)),
    };
  }

  zoomAtPointer(
    pointerX: number,
    pointerY: number,
    newZoom: number,
    layout: ArtboardLayout
  ): void {
    const oldZoom = this.viewport.zoom;
    const zoom = Math.max(MIN_ZOOM, Math.min(newZoom, MAX_ZOOM));
    if (zoom === oldZoom) {
      return;
    }

    const offset = computeArtboardOffset(
      layout.containerWidth,
      layout.containerHeight,
      layout.artboardWidth,
      layout.artboardHeight,
      oldZoom,
      this.viewport.panX,
      this.viewport.panY
    );
    const canvasX = (pointerX - offset.x) / oldZoom;
    const canvasY = (pointerY - offset.y) / oldZoom;
    const newOffsetX = pointerX - canvasX * zoom;
    const newOffsetY = pointerY - canvasY * zoom;

    this.viewport = {
      panX:
        newOffsetX - (layout.containerWidth - layout.artboardWidth * zoom) / 2,
      panY:
        newOffsetY -
        (layout.containerHeight - layout.artboardHeight * zoom) / 2,
      zoom,
    };
  }

  pan(dx: number, dy: number): void {
    this.viewport = {
      ...this.viewport,
      panX: this.viewport.panX + dx,
      panY: this.viewport.panY + dy,
    };
  }

  reset(): void {
    this.viewport = { ...DEFAULT_VIEWPORT };
  }

  adjustZoomForPageResize(
    oldArtboardWidth: number,
    oldArtboardHeight: number,
    newArtboardWidth: number,
    newArtboardHeight: number,
    containerWidth: number,
    containerHeight: number,
    padding = DEFAULT_FIT_PADDING
  ): void {
    const zoom = adjustZoomForPageResize(
      this.viewport.zoom,
      oldArtboardWidth,
      oldArtboardHeight,
      newArtboardWidth,
      newArtboardHeight,
      containerWidth,
      containerHeight,
      padding
    );
    this.viewport = { ...this.viewport, zoom };
  }

  zoomToFit(
    containerWidth: number,
    containerHeight: number,
    artboardWidth: number,
    artboardHeight: number,
    padding = DEFAULT_FIT_PADDING
  ): void {
    if (containerWidth <= 0 || containerHeight <= 0) {
      return;
    }
    const zoom = computeFitZoom(
      containerWidth,
      containerHeight,
      artboardWidth,
      artboardHeight,
      padding
    );
    this.viewport = { panX: 0, panY: 0, zoom };
  }
}
