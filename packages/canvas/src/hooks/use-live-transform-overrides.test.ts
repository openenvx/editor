// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { createDefaultTransform } from '@openenvx/schema';

import { useLiveTransformOverrides } from './use-live-transform-overrides';

describe('useLiveTransformOverrides', () => {
  it('returns the base transform when no override exists', () => {
    const { result } = renderHook(() => useLiveTransformOverrides());
    const base = createDefaultTransform();

    expect(result.current.getLayerTransform('layer-1', base)).toBe(base);
  });

  it('returns the override when one is set', () => {
    const { result } = renderHook(() => useLiveTransformOverrides());
    const base = createDefaultTransform();
    const override = { ...base, width: 200 };

    act(() => {
      result.current.setLiveTransformOverride('layer-1', override);
    });

    expect(result.current.getLayerTransform('layer-1', base)).toEqual(override);
    expect(result.current.liveTransformOverrides.get('layer-1')).toEqual(
      override
    );
  });

  it('clears an override when set to null', () => {
    const { result } = renderHook(() => useLiveTransformOverrides());
    const base = createDefaultTransform();
    const override = { ...base, width: 200 };

    act(() => {
      result.current.setLiveTransformOverride('layer-1', override);
    });
    act(() => {
      result.current.setLiveTransformOverride('layer-1', null);
    });

    expect(result.current.getLayerTransform('layer-1', base)).toBe(base);
    expect(result.current.liveTransformOverrides.has('layer-1')).toBe(false);
  });

  it('replaces all overrides when setLiveTransformOverrides is called', () => {
    const { result } = renderHook(() => useLiveTransformOverrides());
    const base = createDefaultTransform();
    const override = { ...base, width: 300 };

    act(() => {
      result.current.setLiveTransformOverride('layer-1', override);
    });
    act(() => {
      result.current.setLiveTransformOverrides(new Map());
    });

    expect(result.current.liveTransformOverrides.size).toBe(0);
    expect(result.current.getLayerTransform('layer-1', base)).toBe(base);
  });
});
