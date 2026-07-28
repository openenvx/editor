import { describe, expect, it } from 'vitest';

import {
  buildInstanceSurfaceLayerId,
  getLayerChildrenForScene,
  resolveInstanceDefinitionLayers,
} from './expand-instances';
import type { Layer, Scene } from './types';

describe('expand-instances', () => {
  const definitionLayers: Layer[] = [
    {
      data: { fill: '#f00' },
      id: 'rect-1',
      transform: {
        height: 10,
        opacity: 1,
        rotation: 0,
        width: 10,
        x: 0,
        y: 0,
      },
      type: 'canvas.rect',
    },
  ];

  const scene: Scene = {
    components: {
      badge: { id: 'badge', layers: definitionLayers, name: 'Badge' },
    },
    pages: [
      {
        id: 'page-1',
        layers: [],
        layout: 'absolute',
        name: 'Page',
      },
    ],
    schemaVersion: 2,
  };

  it('resolves instance children from components with surface-only ids', () => {
    const instance: Layer = {
      data: { componentId: 'badge' },
      id: 'inst-1',
      transform: {
        height: 40,
        opacity: 1,
        rotation: 0,
        width: 40,
        x: 5,
        y: 5,
      },
      type: 'canvas.instance',
    };

    const [surfaceChild] = getLayerChildrenForScene(instance, scene);
    expect(surfaceChild?.id).toBe(
      buildInstanceSurfaceLayerId('inst-1', 'rect-1')
    );
    expect(surfaceChild?.writeMode).toBe('locked');
    expect(
      resolveInstanceDefinitionLayers(instance, scene.components)[0]?.data
    ).toEqual({ fill: '#f00' });
  });

  it('applies shallow overrides by definition layer id', () => {
    const instance: Layer = {
      data: {
        componentId: 'badge',
        overrides: { 'rect-1': { fill: '#0f0' } },
      },
      id: 'inst-1',
      type: 'canvas.instance',
    };

    expect(
      resolveInstanceDefinitionLayers(instance, scene.components)[0]?.data
    ).toEqual({ fill: '#0f0' });
  });

  it('namespaces ids per instance so two instances do not collide', () => {
    const instA: Layer = {
      data: { componentId: 'badge' },
      id: 'inst-a',
      type: 'canvas.instance',
    };
    const instB: Layer = {
      data: { componentId: 'badge' },
      id: 'inst-b',
      type: 'canvas.instance',
    };

    const aChild = getLayerChildrenForScene(instA, scene)[0]?.id;
    const bChild = getLayerChildrenForScene(instB, scene)[0]?.id;
    expect(aChild).toBe(buildInstanceSurfaceLayerId('inst-a', 'rect-1'));
    expect(bChild).toBe(buildInstanceSurfaceLayerId('inst-b', 'rect-1'));
    expect(aChild).not.toBe(bChild);
  });
});
