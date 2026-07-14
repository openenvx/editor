import { describe, expect, it } from 'vitest';

import {
  canStartHandleDrag,
  canStartLayerDrag,
  canStartTransform,
  getActiveDragAnchor,
  getActiveHandleAnchor,
  getDragSession,
  getTransformSessionLayerId,
  reduceInteractionMode,
  type CanvasInteractionMode,
} from './canvas-interaction-mode';

const idle: CanvasInteractionMode = { type: 'idle' };

const dragSession = {
  layerId: 'layer-a',
  starts: new Map([['layer-a', { x: 0, y: 0 }]]),
};

describe('reduceInteractionMode', () => {
  it('starts layer drag from idle', () => {
    const next = reduceInteractionMode(idle, {
      session: dragSession,
      type: 'layerDragStart',
    });
    expect(next).toEqual({ session: dragSession, type: 'dragging' });
  });

  it('rejects layer drag when not idle', () => {
    const transforming: CanvasInteractionMode = {
      anchor: 'top-left',
      layerId: 'layer-a',
      type: 'transforming',
    };
    expect(
      reduceInteractionMode(transforming, {
        session: dragSession,
        type: 'layerDragStart',
      })
    ).toBe(transforming);
  });

  it('ends layer drag back to idle', () => {
    const dragging: CanvasInteractionMode = {
      session: dragSession,
      type: 'dragging',
    };
    expect(
      reduceInteractionMode(dragging, { type: 'layerDragEnd' })
    ).toEqual(idle);
  });

  it('starts transform from idle', () => {
    const next = reduceInteractionMode(idle, {
      anchor: 'middle-right',
      layerId: 'layer-a',
      type: 'transformStart',
    });
    expect(next).toEqual({
      anchor: 'middle-right',
      layerId: 'layer-a',
      type: 'transforming',
    });
  });

  it('rejects transform when handle dragging', () => {
    const handleDrag: CanvasInteractionMode = {
      anchor: 'custom',
      layerId: 'layer-a',
      type: 'handleDrag',
    };
    expect(
      reduceInteractionMode(handleDrag, {
        anchor: null,
        layerId: 'layer-a',
        type: 'transformStart',
      })
    ).toBe(handleDrag);
  });

  it('ends transform back to idle', () => {
    const transforming: CanvasInteractionMode = {
      anchor: 'rotater',
      layerId: 'layer-a',
      type: 'transforming',
    };
    expect(
      reduceInteractionMode(transforming, { type: 'transformEnd' })
    ).toEqual(idle);
  });

  it('starts handle drag from idle', () => {
    const next = reduceInteractionMode(idle, {
      anchor: 'handle-1',
      layerId: 'layer-a',
      type: 'handleDragStart',
    });
    expect(next).toEqual({
      anchor: 'handle-1',
      layerId: 'layer-a',
      type: 'handleDrag',
    });
  });

  it('ends handle drag back to idle', () => {
    const handleDrag: CanvasInteractionMode = {
      anchor: 'handle-1',
      layerId: 'layer-a',
      type: 'handleDrag',
    };
    expect(
      reduceInteractionMode(handleDrag, { type: 'handleDragEnd' })
    ).toEqual(idle);
  });

  it('forceIdle resets handle drag for escape-key cancellation', () => {
    const handleDrag = reduceInteractionMode(idle, {
      anchor: 'handle-1',
      layerId: 'layer-a',
      type: 'handleDragStart',
    });
    expect(reduceInteractionMode(handleDrag, { type: 'forceIdle' })).toEqual(
      idle
    );
  });
});

describe('interaction mode getters', () => {
  it('reads transform session layer id from transforming and handle drag', () => {
    expect(
      getTransformSessionLayerId({
        anchor: null,
        layerId: 'layer-a',
        type: 'transforming',
      })
    ).toBe('layer-a');
    expect(
      getTransformSessionLayerId({
        anchor: 'h1',
        layerId: 'layer-b',
        type: 'handleDrag',
      })
    ).toBe('layer-b');
    expect(getTransformSessionLayerId(idle)).toBeNull();
  });

  it('reads active anchors from the matching mode', () => {
    expect(
      getActiveDragAnchor({
        anchor: 'top-left',
        layerId: 'layer-a',
        type: 'transforming',
      })
    ).toBe('top-left');
    expect(
      getActiveHandleAnchor({
        anchor: 'handle-1',
        layerId: 'layer-a',
        type: 'handleDrag',
      })
    ).toBe('handle-1');
    expect(getActiveDragAnchor(idle)).toBeNull();
    expect(getActiveHandleAnchor(idle)).toBeNull();
  });

  it('reads drag session only while dragging', () => {
    expect(
      getDragSession({ session: dragSession, type: 'dragging' })
    ).toEqual(dragSession);
    expect(getDragSession(idle)).toBeNull();
  });
});

describe('interaction mode guards', () => {
  it('only allows new interactions from idle', () => {
    const busy: CanvasInteractionMode = {
      session: dragSession,
      type: 'dragging',
    };
    expect(canStartLayerDrag(idle)).toBe(true);
    expect(canStartTransform(idle)).toBe(true);
    expect(canStartHandleDrag(idle)).toBe(true);
    expect(canStartLayerDrag(busy)).toBe(false);
    expect(canStartTransform(busy)).toBe(false);
    expect(canStartHandleDrag(busy)).toBe(false);
  });
});
