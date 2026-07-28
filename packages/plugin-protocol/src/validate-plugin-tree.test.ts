import { describe, expect, it } from 'vitest';

import {
  MAX_PLUGIN_TREE_NODES,
  validatePluginTree,
} from './validate-plugin-tree';

describe('validatePluginTree', () => {
  it('accepts a valid tree', () => {
    const result = validatePluginTree({
      type: 'Pane',
      props: { id: 'assets', title: 'Assets' },
      children: [
        {
          type: 'Text',
          props: { key: 'hi', label: 'Hi', tone: 'muted' },
          children: [],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nodeCount).toBe(2);
      expect(result.root.type).toBe('Pane');
    }
  });

  it('rejects unknown element types', () => {
    const result = validatePluginTree({
      type: 'Script',
      props: {},
      children: [],
    });
    expect(result).toEqual({
      ok: false,
      reason: 'Unknown element type: Script',
    });
  });

  it('accepts inspector Pane trees', () => {
    const result = validatePluginTree({
      type: 'Pane',
      props: { id: 'canvas.layer', title: 'Layer', priority: 20 },
      children: [
        {
          type: 'InputGroup',
          props: { label: 'Position' },
          children: [
            {
              type: 'Number',
              props: {
                label: 'X',
                bind: 'selection.layer.transform.x',
                scrub: true,
                precision: 0,
              },
              children: [],
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.root.type).toBe('Pane');
      expect(result.nodeCount).toBe(3);
    }
  });

  it('rejects field elements with non-string bind', () => {
    const result = validatePluginTree({
      type: 'Number',
      props: { bind: 12 },
      children: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/bind must be a string/);
    }
  });

  it('rejects internal binds when externalPanelId is set', () => {
    const result = validatePluginTree(
      {
        type: 'Number',
        props: {
          label: 'X',
          bind: 'selection.layer.transform.x',
        },
        children: [],
      },
      { externalPanelId: 'assets' }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/plugin\.assets\.\*/);
    }
  });

  it('accepts plugin.* binds for an external panel', () => {
    const result = validatePluginTree(
      {
        type: 'Number',
        props: {
          label: 'X',
          bind: 'plugin.assets.x',
        },
        children: [],
      },
      { externalPanelId: 'assets' }
    );
    expect(result.ok).toBe(true);
  });

  it('rejects oversized trees', () => {
    let node: Record<string, unknown> = {
      type: 'Text',
      props: { label: 'x' },
      children: [],
    };
    for (let i = 0; i < MAX_PLUGIN_TREE_NODES + 2; i += 1) {
      node = { type: 'Block', props: { label: 'b' }, children: [node] };
    }
    const result = validatePluginTree(node);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/node count|Invalid|Unknown/);
    }
  });
});
