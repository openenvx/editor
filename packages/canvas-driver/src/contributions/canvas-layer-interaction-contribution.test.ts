import { describe, expect, it } from 'vitest';

import {
  CanvasLayerInteractionContribution,
  toCanvasLayerInteractionRegistration,
} from './canvas-layer-interaction-contribution';
import type { HandleDescriptor } from '../registry/canvas-registry-types';

class TestHandleInteraction extends CanvasLayerInteractionContribution {
  readonly kind = 'test';

  providesHandles() {
    return true;
  }

  layoutHandles() {
    return [
      {
        anchor: 'middle-left',
        height: 8,
        rotation: 0,
        width: 8,
        x: 0,
        y: 10,
      } satisfies HandleDescriptor,
    ];
  }

  onHandleDragStart() {}

  onHandleDragMove() {}

  onHandleDragEnd() {
    return {
      dataPatch: { crop: { height: 1, width: 1, x: 0, y: 0 } },
      transform: {
        height: 100,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        width: 100,
        x: 0,
        y: 0,
      },
    };
  }
}

describe('toCanvasLayerInteractionRegistration', () => {
  it('binds generic handle hooks', () => {
    const contribution = new TestHandleInteraction();
    const registration = toCanvasLayerInteractionRegistration(contribution);

    expect(registration.providesHandles?.({})).toBe(true);
    expect(
      registration.layoutHandles?.({
        layerId: 'layer-1',
        node: null,
        transform: {
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          width: 100,
          x: 0,
          y: 0,
        },
        view: {},
        zoom: 1,
      })
    ).toEqual([
      {
        anchor: 'middle-left',
        height: 8,
        rotation: 0,
        width: 8,
        x: 0,
        y: 10,
      },
    ]);
    expect(
      registration.onHandleDragEnd?.({
        anchor: 'middle-left',
        layerId: 'layer-1',
        node: null,
        transform: {
          height: 100,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          width: 100,
          x: 0,
          y: 0,
        },
        view: {},
        zoom: 1,
      })?.dataPatch
    ).toEqual({ crop: { height: 1, width: 1, x: 0, y: 0 } });
  });
});
