import type { Scene,ViewDescriptor,ViewTreeItem } from '@openenvx/core';
import { act, renderHook } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { useViewTreeCollapseSeed } from './use-view-tree-collapse-seed';
import {
  resolveViewHoveredIds,
  useViewTreeHoverExpand,
} from './use-view-tree-hover-sync';
import { useViewTreeSelectionSync } from './use-view-tree-selection-sync';

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
  viewSelection: ViewDescriptor['viewSelection'] = 'layer',
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
    viewSelection,
    viewHover,
  };
}

function treeItem(
  id: string,
  hasChildren: boolean,
  depth = 0
): ViewTreeItem {
  return {
    depth,
    hasChildren,
    id,
    label: id,
    source: id,
  };
}

describe('resolveViewHoveredIds', () => {
  it('returns empty set when hoveredLayerId is null', () => {
    expect(resolveViewHoveredIds(createView(), null, 'p1')).toEqual(new Set());
  });

  it('returns empty set when viewHover is none', () => {
    expect(
      resolveViewHoveredIds(createView('layer', 'none'), 'layer-a', 'p1')
    ).toEqual(new Set());
  });

  it('returns hovered layer id for layer viewHover', () => {
    expect(
      resolveViewHoveredIds(createView('layer', 'layer'), 'layer-a', 'p1')
    ).toEqual(new Set(['layer-a']));
  });

  it('returns active page id for page viewHover', () => {
    expect(
      resolveViewHoveredIds(createView('layer', 'page'), 'layer-a', 'p1')
    ).toEqual(new Set(['p1']));
  });

  it('returns empty set for page viewHover without active page', () => {
    expect(
      resolveViewHoveredIds(createView('layer', 'page'), 'layer-a', '')
    ).toEqual(new Set());
  });
});

describe('useViewTreeCollapseSeed', () => {
  it('collapses nestable ids on first see', () => {
    const items = [treeItem('group', true), treeItem('child', false, 1)];
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
      useViewTreeCollapseSeed(items, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
    expect(result.current.has('child')).toBe(false);
  });

  it('does not re-collapse after user expands', () => {
    const items = [treeItem('group', true)];
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
      useViewTreeCollapseSeed(items, setCollapsed);
      return { collapsed, setCollapsed };
    });

    expect(result.current.collapsed.has('group')).toBe(true);

    act(() => {
      result.current.setCollapsed((prev) => {
        const next = new Set(prev);
        next.delete('group');
        return next;
      });
    });

    expect(result.current.collapsed.has('group')).toBe(false);

    // Same items again — still expanded
    act(() => {
      result.current.setCollapsed((prev) => new Set(prev));
    });
    expect(result.current.collapsed.has('group')).toBe(false);
  });

  it('skips keepExpandedIds when seeding', () => {
    const items = [treeItem('group', true), treeItem('other', true)];
    const keep = new Set(['group']);
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
      useViewTreeCollapseSeed(items, setCollapsed, keep);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(false);
    expect(result.current.has('other')).toBe(true);
  });
});

describe('useViewTreeSelectionSync', () => {
  it('expands selected node and ancestors', () => {
    const view = createView('layer');
    const selected = new Set(['child']);
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group', 'child'])
      );
      useViewTreeSelectionSync(view, selected, scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(false);
    expect(result.current.has('child')).toBe(false);
  });

  it('does not expand when viewSelection is page', () => {
    const view = createView('page');
    const selected = new Set(['child']);
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeSelectionSync(view, selected, scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
  });

  it('does not expand when selection is empty', () => {
    const view = createView('layer');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeSelectionSync(view, new Set(), scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
  });
});

describe('useViewTreeHoverExpand', () => {
  it('expands ancestors of hovered layer', () => {
    const view = createView('layer', 'layer');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeHoverExpand(view, 'child', scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(false);
  });

  it('does not expand when viewHover is none', () => {
    const view = createView('layer', 'none');
    const { result } = renderHook(() => {
      const [collapsed, setCollapsed] = useState<Set<string>>(
        () => new Set(['group'])
      );
      useViewTreeHoverExpand(view, 'child', scene, setCollapsed);
      return collapsed;
    });

    expect(result.current.has('group')).toBe(true);
  });
});
