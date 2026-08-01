/**
 * Canvas interaction contracts — regression guards against features fighting
 * each other (drag vs transform vs handle-drag vs preview).
 *
 * Rule of thumb: exactly one exclusive interaction owns the stage at a time.
 * New gestures must be rejected while another mode is active (except the
 * documented preview → handleDrag hand-off).
 */
import { describe, expect, it } from 'vitest';

import {
  canStartHandleDrag,
  canStartLayerDrag,
  canStartLayerPreview,
  canStartTransform,
  reduceInteractionMode,
  type CanvasInteractionEvent,
  type CanvasInteractionMode,
} from './canvas-interaction-mode';

const idle: CanvasInteractionMode = { type: 'idle' };

const dragSession = {
  layerId: 'layer-a',
  starts: new Map([['layer-a', { x: 0, y: 0 }]]),
};

const busyModes: CanvasInteractionMode[] = [
  { session: dragSession, type: 'dragging' },
  { anchor: 'top-right', layerId: 'layer-a', type: 'transforming' },
  { anchor: 'handle-1', layerId: 'layer-a', type: 'handleDrag' },
  { layerId: 'layer-a', type: 'layerPreview' },
];

const startEvents: CanvasInteractionEvent[] = [
  { session: dragSession, type: 'layerDragStart' },
  { anchor: 'middle-right', layerId: 'layer-a', type: 'transformStart' },
  { anchor: 'handle-1', layerId: 'layer-a', type: 'handleDragStart' },
  { layerId: 'layer-a', type: 'layerPreviewStart' },
];

describe('canvas interaction exclusivity contracts', () => {
  it('idle allows every exclusive gesture to start', () => {
    expect(canStartLayerDrag(idle)).toBe(true);
    expect(canStartTransform(idle)).toBe(true);
    expect(canStartHandleDrag(idle)).toBe(true);
    expect(canStartLayerPreview(idle)).toBe(true);
  });

  it('busy modes reject foreign start events (no overlapping ownership)', () => {
    for (const mode of busyModes) {
      for (const event of startEvents) {
        // Documented exception: handle drag may start from layer preview
        // for the same layer (image crop / similar).
        if (
          mode.type === 'layerPreview' &&
          event.type === 'handleDragStart' &&
          event.layerId === mode.layerId
        ) {
          const next = reduceInteractionMode(mode, event);
          expect(next.type).toBe('handleDrag');
          continue;
        }

        const next = reduceInteractionMode(mode, event);
        expect(next).toBe(mode);
      }
    }
  });

  it('dragging blocks transform and handle drag (prevents jump mid-move)', () => {
    const dragging: CanvasInteractionMode = {
      session: dragSession,
      type: 'dragging',
    };
    expect(canStartTransform(dragging)).toBe(false);
    expect(canStartHandleDrag(dragging)).toBe(false);
    expect(canStartLayerDrag(dragging)).toBe(false);
  });

  it('transforming blocks layer drag (prevents selection/drag stealing anchors)', () => {
    const transforming: CanvasInteractionMode = {
      anchor: 'top-right',
      layerId: 'layer-a',
      type: 'transforming',
    };
    expect(canStartLayerDrag(transforming)).toBe(false);
    expect(canStartLayerPreview(transforming)).toBe(false);
    expect(
      reduceInteractionMode(transforming, {
        session: dragSession,
        type: 'layerDragStart',
      })
    ).toBe(transforming);
  });

  it('forceIdle always returns to a clean slate', () => {
    for (const mode of busyModes) {
      expect(reduceInteractionMode(mode, { type: 'forceIdle' })).toEqual(idle);
    }
  });
});
