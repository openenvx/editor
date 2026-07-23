import type { Scene } from '@openenvx/core';
import type { ViewDescriptor } from '@openenvx/headless';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useState } from 'react';

import {
  resolveViewHoveredIds,
  useViewTreeHoverSync,
} from './use-view-tree-hover-sync';

const transform = {
  height: 100,
  opacity: 1,
  rotation: 0,
  width: 100,
  x: 0,
  y: 0,
};

const scene: Scene = {
  activePageId: 'p1',
  pages: [
    {
      id: 'p1',
      layout: 'absolute',
      width: 800,
      height: 600,
      layers: [
        {
          data: {
            children: [
              {
                data: { fill: '#000000' },
                id: 'child',
                transform,
                type: 'canvas.rect',
              },
            ],
            layout: 'column',
          },
          id: 'group',
          transform,
          type: 'container',
        },
      ],
      name: 'Page',
    },
  ],
  selection: {
    activePageId: 'p1',
    primaryLayerId: null,
    selectedLayerIds: [],
  },
};

function createView(
  viewHover: ViewDescriptor['viewHover'] = 'layer'
): ViewDescriptor {
  return {
    collapsible: true,
    containerId: 'layers',
    content: { items: [], kind: 'tree' },
    id: 'workbench.layers',
    initialCollapsed: false,
    name: 'Layers',
    supportsReorder: true,
    viewOrder: 0,
    viewSelection: 'layer',
    viewHover,
  };
}

describe('resolveViewHoveredIds', () => {
  it('returns empty set when hoveredLayerId is null', () => {
    expect(resolveViewHoveredIds(createView('layer'), null, 'p1')).toEqual(
      new Set()
    );
  });

  it('returns empty set when viewHover is none', () => {
    expect(
      resolveViewHoveredIds(createView('none'), 'layer-a', 'p1')
    ).toEqual(new Set());
  });

  it('returns hovered layer id for layer viewHover', () => {
    expect(
      resolveViewHoveredIds(createView('layer'), 'layer-a', 'p1')
    ).toEqual(new Set(['layer-a']));
  });

  it('returns active page id for page viewHover', () => {
    expect(
      resolveViewHoveredIds(createView('page'), 'layer-a', 'p1')
    ).toEqual(new Set(['p1']));
  });

  it('returns empty set for page viewHover without active page', () => {
    expect(
      resolveViewHoveredIds(createView('page'), 'layer-a', '')
    ).toEqual(new Set());
  });
});

describe('useViewTreeHoverSync', () => {
  it('expands collapsed ancestors when hovered layer changes', () => {
    const view = createView('layer');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeHoverSync(view, 'child', scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(false);
  });

  it('does not change collapsed state when viewHover is none', () => {
    const view = createView('none');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeHoverSync(view, 'child', scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
  });

  it('does not change collapsed state when hoveredLayerId is null', () => {
    const view = createView('layer');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeHoverSync(view, null, scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
  });

  it('updates collapsed ancestors when hover changes', () => {
    const view = createView('layer');
    const { result, rerender } = renderHook(
      ({
        hoveredLayerId,
      }: {
        hoveredLayerId: string | null;
      }) => {
        const [collapsed, setCollapsed] = useState<Set<string>>(
          () => new Set(['group'])
        );
        useViewTreeHoverSync(view, hoveredLayerId, scene, setCollapsed);
        return collapsed;
      },
      { initialProps: { hoveredLayerId: null as string | null } }
    );

    expect(result.current.has('group')).toBe(true);

    rerender({ hoveredLayerId: 'child' });
    expect(result.current.has('group')).toBe(false);

    act(() => {
      rerender({ hoveredLayerId: null });
    });
    expect(result.current.has('group')).toBe(false);
  });
});
