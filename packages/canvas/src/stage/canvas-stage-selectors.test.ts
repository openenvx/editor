import { createDefaultTransform } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  selectLayerHideContent,
  selectLayerSlice,
  selectLayerTransform,
} from '../stage/canvas-stage-selectors';
import { createCanvasStageSnapshot } from '../stage/canvas-stage-snapshot';

describe('canvas-stage-selectors', () => {
  it('selectLayerTransform prefers live override over base transform', () => {
    const base = createDefaultTransform();
    const override = { ...base, width: 240 };
    const snapshot = createCanvasStageSnapshot({
      liveTransforms: new Map([['layer-1', override]]),
      mode: { type: 'idle' },
    });

    expect(selectLayerTransform(snapshot, 'layer-1', base)).toEqual(override);
    expect(selectLayerTransform(snapshot, 'layer-2', base)).toBe(base);
  });

  it('selectLayerHideContent hides imperative transform targets', () => {
    const snapshot = createCanvasStageSnapshot({
      mode: { anchor: 'middle-right', layerId: 'layer-1', type: 'transforming' },
    });

    expect(
      selectLayerHideContent(snapshot, 'layer-1', {
        hideContentDuringTransform: () => true,
        kind: 'image',
      }, null)
    ).toBe(true);
    expect(
      selectLayerHideContent(snapshot, 'layer-2', {
        hideContentDuringTransform: () => true,
        kind: 'image',
      }, null)
    ).toBe(false);
  });

  it('selectLayerHideContent hides handle-drag targets', () => {
    const snapshot = createCanvasStageSnapshot({
      mode: { anchor: 'middle-right', layerId: 'layer-1', type: 'handleDrag' },
    });

    expect(
      selectLayerHideContent(snapshot, 'layer-1', {
        hideContentDuringTransform: () => true,
        kind: 'image',
      }, null)
    ).toBe(true);
  });

  it('selectLayerSlice composes transform and interaction flags', () => {
    const base = createDefaultTransform();
    const snapshot = createCanvasStageSnapshot({
      liveTransforms: new Map([['layer-1', { ...base, height: 120 }]]),
      mode: { type: 'idle' },
    });

    expect(
      selectLayerSlice(snapshot, 'layer-1', base, undefined, null, true, true)
    ).toEqual({
      draggable: true,
      hideContent: false,
      transform: { ...base, height: 120 },
      visible: true,
    });
  });

  it('selectLayerSlice disables dragging during an imperative transform', () => {
    const base = createDefaultTransform();
    const snapshot = createCanvasStageSnapshot({
      mode: { anchor: 'middle-right', layerId: 'layer-1', type: 'transforming' },
    });

    expect(
      selectLayerSlice(snapshot, 'layer-1', base, undefined, null, true, true)
    ).toMatchObject({
      draggable: false,
    });
  });

  it('selectLayerSlice disables dragging when the layer is not selected', () => {
    const base = createDefaultTransform();
    const snapshot = createCanvasStageSnapshot({
      mode: { type: 'idle' },
    });

    expect(
      selectLayerSlice(
        snapshot,
        'layer-1',
        base,
        undefined,
        null,
        true,
        true,
        false
      )
    ).toMatchObject({
      draggable: false,
    });
  });

  it('selectLayerSlice hides non-visible layers', () => {
    const base = createDefaultTransform();
    const snapshot = createCanvasStageSnapshot({
      mode: { type: 'idle' },
    });

    expect(
      selectLayerSlice(
        snapshot,
        'layer-1',
        base,
        undefined,
        null,
        true,
        false
      )
    ).toMatchObject({
      draggable: false,
      visible: false,
    });
  });
});
