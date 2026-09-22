import type { DocumentNode } from '@openenvx/studio/schema';
import { getLayerChildren } from '@openenvx/studio/core';
import { nodeTransform } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import {
  cloneLayers,
  getLayersBoundingBox,
  offsetLayers,
  positionLayersAtAnchor,
} from './clone-layers-for-paste';
import { legacyLayer } from '../test/canvas-document-fixtures';

function makeLayer(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): DocumentNode {
  return legacyLayer({
    data: {},
    id,
    transform: { height, width, x, y },
    type: 'canvas.rect',
  });
}

describe('clone-layers-for-paste', () => {
  it('clones layers with new ids', () => {
    const layers = [makeLayer('a', 0, 0, 100, 50)];
    const cloned = cloneLayers(layers);
    expect(cloned).toHaveLength(1);
    expect(cloned[0]!.id).not.toBe('a');
    expect(nodeTransform(cloned[0]!).x).toBe(0);
  });

  it('remaps nested group children ids', () => {
    const layers: DocumentNode[] = [
      legacyLayer({
        children: [makeLayer('child-1', 0, 0, 10, 10)],
        id: 'group-1',
        type: 'canvas.group',
      }),
    ];
    const cloned = cloneLayers(layers);
    const children = getLayerChildren(cloned[0]!);
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
    expect(nodeTransform(positioned[0]!).x).toBe(200);
    expect(nodeTransform(positioned[0]!).y).toBe(300);
    expect(nodeTransform(positioned[1]!).x).toBe(250);
    expect(nodeTransform(positioned[1]!).y).toBe(320);
  });

  it('offsets layers by delta', () => {
    const layers = [makeLayer('a', 10, 20, 100, 50)];
    const offset = offsetLayers(layers, 10, 10);
    expect(nodeTransform(offset[0]!).x).toBe(20);
    expect(nodeTransform(offset[0]!).y).toBe(30);
  });
});
