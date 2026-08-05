import { createDefaultTransform } from '@xmazu/openenvxee-schema';
import type { Layer } from '@xmazu/openenvxee-schema';
import { describe, expect, it } from 'vitest';

import {
  cloneLayers,
  getLayersBoundingBox,
  offsetLayers,
  positionLayersAtAnchor,
} from './clone-layers-for-paste';

function makeLayer(id: string, x: number, y: number, width: number, height: number): Layer {
  return {
    data: {},
    id,
    transform: { ...createDefaultTransform(), height, width, x, y },
    type: 'canvas.rect',
  };
}

describe('clone-layers-for-paste', () => {
  it('clones layers with new ids', () => {
    const layers = [makeLayer('a', 0, 0, 100, 50)];
    const cloned = cloneLayers(layers);
    expect(cloned).toHaveLength(1);
    expect(cloned[0]!.id).not.toBe('a');
    expect(cloned[0]!.transform?.x).toBe(0);
  });

  it('remaps nested group children ids', () => {
    const layers: Layer[] = [
      {
        id: 'group-1',
        type: 'canvas.group',
        data: {
          children: [makeLayer('child-1', 0, 0, 10, 10)],
        },
        transform: createDefaultTransform(),
      },
    ];
    const cloned = cloneLayers(layers);
    const children = (cloned[0]!.data as { children: Layer[] }).children;
    expect(cloned[0]!.id).not.toBe('group-1');
    expect(children[0]!.id).not.toBe('child-1');
  });

  it('computes bounding box across layers', () => {
    const layers = [
      makeLayer('a', 10, 20, 100, 50),
      makeLayer('b', 60, 40, 80, 30),
    ];
    const box = getLayersBoundingBox(layers);
    expect(box).toEqual({ x: 10, y: 20, width: 130, height: 50 });
  });

  it('positions layers at anchor preserving relative layout', () => {
    const layers = [
      makeLayer('a', 10, 20, 100, 50),
      makeLayer('b', 60, 40, 80, 30),
    ];
    const positioned = positionLayersAtAnchor(
      layers,
      { x: 10, y: 20 },
      { x: 200, y: 300 }
    );
    expect(positioned[0]!.transform?.x).toBe(200);
    expect(positioned[0]!.transform?.y).toBe(300);
    expect(positioned[1]!.transform?.x).toBe(250);
    expect(positioned[1]!.transform?.y).toBe(320);
  });

  it('offsets layers by delta', () => {
    const layers = [makeLayer('a', 10, 20, 100, 50)];
    const offset = offsetLayers(layers, 10, 10);
    expect(offset[0]!.transform?.x).toBe(20);
    expect(offset[0]!.transform?.y).toBe(30);
  });
});
