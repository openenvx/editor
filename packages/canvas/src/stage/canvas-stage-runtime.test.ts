import { createDefaultTransform } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { selectLayerTransform } from './canvas-stage-selectors';
import {
  createCanvasStageRuntime,
  type CanvasStageRuntime,
} from './canvas-stage-runtime';

describe('CanvasStageRuntime live transforms', () => {
  let runtime: CanvasStageRuntime;

  function getBaseTransform() {
    return createDefaultTransform();
  }

  it('returns the base transform when no override exists', () => {
    runtime = createCanvasStageRuntime();
    const base = getBaseTransform();

    expect(runtime.getLayerTransform('layer-1', base)).toBe(base);
    expect(
      selectLayerTransform(runtime.getSnapshot(), 'layer-1', base)
    ).toBe(base);
  });

  it('returns the override when one is set', () => {
    runtime = createCanvasStageRuntime();
    const base = getBaseTransform();
    const override = { ...base, width: 200 };

    runtime.setLiveTransformOverride('layer-1', override);

    expect(runtime.getLayerTransform('layer-1', base)).toEqual(override);
    expect(runtime.getSnapshot().liveTransforms.get('layer-1')).toEqual(
      override
    );
  });

  it('clears an override when set to null', () => {
    runtime = createCanvasStageRuntime();
    const base = getBaseTransform();
    const override = { ...base, width: 200 };

    runtime.setLiveTransformOverride('layer-1', override);
    runtime.setLiveTransformOverride('layer-1', null);

    expect(runtime.getLayerTransform('layer-1', base)).toBe(base);
    expect(runtime.getSnapshot().liveTransforms.has('layer-1')).toBe(false);
  });

  it('replaces all overrides when setLiveTransformOverrides is called', () => {
    runtime = createCanvasStageRuntime();
    const base = getBaseTransform();
    const override = { ...base, width: 300 };

    runtime.setLiveTransformOverride('layer-1', override);
    runtime.setLiveTransformOverrides(new Map());

    expect(runtime.getSnapshot().liveTransforms.size).toBe(0);
    expect(runtime.getLayerTransform('layer-1', base)).toBe(base);
  });

  it('keeps a stable snapshot identity until a mutation occurs', () => {
    runtime = createCanvasStageRuntime();
    const first = runtime.getSnapshot();
    const second = runtime.getSnapshot();

    expect(first).toBe(second);

    runtime.setLiveTransformOverride('layer-1', getBaseTransform());

    expect(runtime.getSnapshot()).not.toBe(first);
  });
});
