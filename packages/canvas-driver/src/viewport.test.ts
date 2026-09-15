import { describe, expect, it } from "vitest";

import { computeArtboardOffset } from "./artboard-offset";
import {
  adjustZoomForPageResize,
  computeFitZoom,
  computeWheelZoom,
  hitTestLayer,
  isWheelZoomGesture,
  normalizeWheelDeltaY,
  screenToCanvas,
  ViewportController,
} from "./viewport";

describe("canvas viewport", () => {
  it("converts screen to canvas coordinates", () => {
    const point = screenToCanvas(100, 50, { panX: 10, panY: 20, zoom: 2 });
    expect(point).toStrictEqual({ x: 45, y: 15 });
  });

  it("hit tests layer bounds", () => {
    expect(
      hitTestLayer(
        { x: 15, y: 15 },
        {
          height: 20,
          opacity: 1,
          rotation: 0,
          width: 20,
          x: 10,
          y: 10,
        }
      )
    ).toBeTruthy();
  });

  it("zooms viewport", () => {
    const viewport = new ViewportController();
    viewport.setZoom(2);
    expect(viewport.getViewport().zoom).toBe(2);
  });

  it("applies exponential wheel zoom from pixel deltas", () => {
    const nextZoom = computeWheelZoom(1, 10, 0.001);
    expect(nextZoom).toBeCloseTo(Math.exp(-0.01), 5);
    expect(nextZoom).toBeLessThan(1);
  });

  it("normalizes line-mode wheel deltas to pixels", () => {
    expect(normalizeWheelDeltaY(3, WheelEvent.DOM_DELTA_LINE, 800)).toBe(48);
  });

  it("treats pinch and mouse wheel as zoom gestures", () => {
    expect(isWheelZoomGesture(true, WheelEvent.DOM_DELTA_PIXEL)).toBe(true);
    expect(isWheelZoomGesture(false, WheelEvent.DOM_DELTA_LINE)).toBe(true);
    expect(isWheelZoomGesture(false, WheelEvent.DOM_DELTA_PIXEL)).toBe(false);
  });

  it("zooms toward the pointer without shifting the anchor point", () => {
    const viewport = new ViewportController();
    viewport.setZoom(1);
    const layout = {
      artboardHeight: 100,
      artboardWidth: 100,
      containerHeight: 200,
      containerWidth: 200,
    };
    const pointer = { x: 100, y: 100 };

    const before = computeArtboardOffset(
      layout.containerWidth,
      layout.containerHeight,
      layout.artboardWidth,
      layout.artboardHeight,
      1,
      0,
      0
    );
    const canvasX = (pointer.x - before.x) / 1;
    const canvasY = (pointer.y - before.y) / 1;

    viewport.zoomAtPointer(pointer.x, pointer.y, 2, layout);

    const after = viewport.getViewport();
    const offset = computeArtboardOffset(
      layout.containerWidth,
      layout.containerHeight,
      layout.artboardWidth,
      layout.artboardHeight,
      after.zoom,
      after.panX,
      after.panY
    );

    expect(canvasX * after.zoom + offset.x).toBeCloseTo(pointer.x, 5);
    expect(canvasY * after.zoom + offset.y).toBeCloseTo(pointer.y, 5);
    expect(after.zoom).toBe(2);
  });

  it("zooms out when resizing to a smaller page", () => {
    const containerWidth = 1000;
    const containerHeight = 800;
    const oldWidth = 800;
    const oldHeight = 1100;
    const newWidth = 560;
    const newHeight = 770;
    const currentZoom = 0.6;

    const nextZoom = adjustZoomForPageResize(
      currentZoom,
      oldWidth,
      oldHeight,
      newWidth,
      newHeight,
      containerWidth,
      containerHeight
    );

    expect(nextZoom).toBeLessThan(currentZoom);
  });

  it("zooms in when resizing to a larger page and room remains below fit", () => {
    const containerWidth = 1000;
    const containerHeight = 800;
    const oldWidth = 560;
    const oldHeight = 770;
    const newWidth = 800;
    const newHeight = 1100;
    const currentZoom = 0.4;

    const nextZoom = adjustZoomForPageResize(
      currentZoom,
      oldWidth,
      oldHeight,
      newWidth,
      newHeight,
      containerWidth,
      containerHeight
    );
    const fitZoom = computeFitZoom(
      containerWidth,
      containerHeight,
      newWidth,
      newHeight
    );

    expect(nextZoom).toBeGreaterThan(currentZoom);
    expect(nextZoom).toBeLessThanOrEqual(fitZoom);
  });

  it("does not zoom in past fit when the page is already fully visible", () => {
    const containerWidth = 1000;
    const containerHeight = 800;
    const oldWidth = 560;
    const oldHeight = 770;
    const newWidth = 800;
    const newHeight = 1100;
    const fitZoom = computeFitZoom(
      containerWidth,
      containerHeight,
      newWidth,
      newHeight
    );

    const nextZoom = adjustZoomForPageResize(
      fitZoom,
      oldWidth,
      oldHeight,
      newWidth,
      newHeight,
      containerWidth,
      containerHeight
    );

    expect(nextZoom).toBe(fitZoom);
  });
});
