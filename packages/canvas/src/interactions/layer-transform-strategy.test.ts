import { describe, expect, it, vi } from 'vitest';

import {
  defaultTransformStrategy,
  genericTransformStrategy,
  richTextTransformStrategy,
  selectTransformStrategy,
} from './layer-transform-strategy';

describe('selectTransformStrategy', () => {
  it('returns richText strategy for richText kind', () => {
    expect(selectTransformStrategy('richText')).toBe(richTextTransformStrategy);
  });

  it('returns generic strategy for other interaction kinds', () => {
    expect(selectTransformStrategy('image')).toBe(genericTransformStrategy);
    expect(selectTransformStrategy('rect')).toBe(genericTransformStrategy);
  });

  it('returns default strategy when kind is undefined', () => {
    expect(selectTransformStrategy()).toBe(defaultTransformStrategy);
  });
});

describe('genericTransformStrategy', () => {
  it('endSession clears the generic session ref', () => {
    const genericTransformSessionRef = { current: { layerId: 'layer-1' } };
    const refs = {
      bakeInProgressRef: { current: false },
      cornerBakeRafRef: { current: null },
      genericTransformSessionRef,
      richTextCornerSessionRef: { current: null },
      transformDragRef: { current: null },
    };

    genericTransformStrategy.endSession(refs);

    expect(genericTransformSessionRef.current).toBeNull();
  });
});

describe('richTextTransformStrategy', () => {
  it('boundBox returns null when there is no active session', () => {
    const refs = {
      bakeInProgressRef: { current: false },
      cornerBakeRafRef: { current: null },
      genericTransformSessionRef: { current: null },
      richTextCornerSessionRef: { current: null },
      transformDragRef: { current: { anchor: 'middle-left' } },
    };

    const result = richTextTransformStrategy.boundBox({
      getTransformModifiers: () => ({ alt: false, meta: false, shift: false }),
      newBox: { height: 100, rotation: 0, width: 100, x: 0, y: 0 },
      oldBox: { height: 100, rotation: 0, width: 100, x: 0, y: 0 },
      refs,
      setLiveTransformOverride: vi.fn(),
      transformerRef: { current: null },
    });

    expect(result).toBeNull();
  });
});
