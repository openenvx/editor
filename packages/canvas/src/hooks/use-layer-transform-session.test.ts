// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { createDefaultTransform } from '@openenvx/core/schema';
import type Konva from 'konva';
import { describe, expect, it, vi } from 'vitest';

import { useLayerTransformSession } from './use-layer-transform-session';

function createSessionHookInput() {
  const onTransform = vi.fn();
  const transformerRef = { current: null as Konva.Transformer | null };
  const nodeRefs = { current: new Map<string, Konva.Group>() };
  const setActiveDragAnchor = vi.fn();

  return {
    input: {
      artboardHeight: 800,
      artboardWidth: 600,
      clearOverlays: vi.fn(),
      flattenedLayers: [],
      getGridConfig: () => null,
      getMarginInset: () => null,
      getOtherLayers: () => [],
      getUserGuidesConfig: () => null,
      getTransformModifiers: () => ({ alt: false, meta: false, shift: false }),
      isRichTextSelected: false,
      nodeRefs,
      onTransformRef: { current: onTransform },
      primaryLayerIdRef: { current: 'layer-1' },
      selectedInteraction: undefined,
      selectedLayer: undefined,
      selectedLayerIdsRef: { current: ['layer-1'] },
      selectedPrimary: 'layer-1',
      setActiveDragAnchor,
      setInteractionOverlays: vi.fn(),
      setLiveTransformOverride: vi.fn(),
      setLiveTransformOverrides: vi.fn(),
      stageInteractionRef: { current: null },
      syncLabelFromTransformer: vi.fn(),
      transformerRef,
      updateSizeLabelImperatively: vi.fn(),
      vpZoom: 1,
    },
    onTransform,
    setActiveDragAnchor,
    transformerRef,
  };
}

describe('useLayerTransformSession integration', () => {
  it('exposes transform session handlers', () => {
    const { input } = createSessionHookInput();
    const { result } = renderHook(() => useLayerTransformSession(input));

    expect(result.current.transformSessionLayerId).toBeNull();
    expect(typeof result.current.handleTransformStart).toBe('function');
    expect(typeof result.current.completeLayerTransform).toBe('function');
    expect(typeof result.current.boundBoxFunc).toBe('function');
  });

  it('passes through bound box when no strategy constraints apply', () => {
    const { input } = createSessionHookInput();
    const { result } = renderHook(() => useLayerTransformSession(input));
    const oldBox = {
      height: 100,
      rotation: 0,
      width: 100,
      x: 10,
      y: 20,
    };
    const newBox = {
      height: 120,
      rotation: 0,
      width: 140,
      x: 10,
      y: 20,
    };

    expect(result.current.boundBoxFunc(oldBox, newBox)).toEqual(newBox);
  });

  it('completes a default transform and notifies onTransform', () => {
    const { input, onTransform } = createSessionHookInput();
    const { result } = renderHook(() => useLayerTransformSession(input));
    const transform = createDefaultTransform();
    const node = {
      height: () => transform.height,
      position: vi.fn(),
      rotation: vi.fn(() => transform.rotation),
      scale: vi.fn(),
      scaleX: () => 1,
      scaleY: () => 1,
      size: vi.fn(),
      width: () => transform.width,
      x: () => transform.x,
      y: () => transform.y,
    } as unknown as Konva.Group;

    act(() => {
      result.current.completeLayerTransform({
        interactionKind: undefined,
        layerId: 'layer-1',
        node,
        transform,
        view: { assetId: 'asset-1', kind: 'image' },
      });
    });

    expect(onTransform).toHaveBeenCalledWith(
      'layer-1',
      expect.objectContaining({
        transform: expect.objectContaining({
          height: transform.height,
          width: transform.width,
        }),
      })
    );
    expect(result.current.transformSessionLayerId).toBeNull();
  });
});
