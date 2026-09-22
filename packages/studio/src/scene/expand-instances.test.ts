import { describe, expect, it } from 'vitest';

import {
  buildInstanceSurfaceLayerId,
  getLayerChildrenForScene,
  resolveInstanceDefinitionLayers,
} from './expand-instances';
import type { DocumentNode, Document } from './types';

describe('expand-instances', () => {
  const definitionNodes: DocumentNode[] = [
    {
      frame: { height: 10, rotation: 0, width: 10, x: 0, y: 0 },
      id: 'rect-1',
      opacity: 1,
      props: { fill: '#f00' },
      scaleX: 1,
      scaleY: 1,
      type: 'canvas.rect',
    },
  ];

  const document: Document = {
    artboards: [
      {
        extensions: { layout: 'absolute' },
        id: 'page-1',
        name: 'Page',
        nodes: [],
        physical: { dpi: 96, unit: 'px' },
        space: {},
      },
    ],
    components: {
      badge: { id: 'badge', name: 'Badge', nodes: definitionNodes },
    },
  };

  it('resolves instance children from components with surface-only ids', () => {
    const instance: DocumentNode = {
      frame: {
        height: 40,
        rotation: 0,
        width: 40,
        x: 5,
        y: 5,
      },
      id: 'inst-1',
      opacity: 1,
      props: { componentId: 'badge' },
      scaleX: 1,
      scaleY: 1,
      type: 'canvas.instance',
    };

    const [surfaceChild] = getLayerChildrenForScene(instance, document);
    expect(surfaceChild?.id).toBe(
      buildInstanceSurfaceLayerId('inst-1', 'rect-1')
    );
    expect(surfaceChild?.writeMode).toBe('locked');
    expect(
      resolveInstanceDefinitionLayers(instance, document.components)[0]?.props
    ).toEqual({ fill: '#f00' });
  });

  it('applies shallow overrides by definition layer id', () => {
    const instance: DocumentNode = {
      id: 'inst-1',
      props: {
        componentId: 'badge',
        overrides: { 'rect-1': { fill: '#0f0' } },
      },
      type: 'canvas.instance',
    };

    expect(
      resolveInstanceDefinitionLayers(instance, document.components)[0]?.props
    ).toEqual({ fill: '#0f0' });
  });

  it('namespaces ids per instance so two instances do not collide', () => {
    const a: DocumentNode = {
      id: 'inst-a',
      props: { componentId: 'badge' },
      type: 'canvas.instance',
    };
    const b: DocumentNode = {
      id: 'inst-b',
      props: { componentId: 'badge' },
      type: 'canvas.instance',
    };
    const [childA] = getLayerChildrenForScene(a, document);
    const [childB] = getLayerChildrenForScene(b, document);
    expect(childA?.id).not.toBe(childB?.id);
  });
});
