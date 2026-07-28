import { describe, expect, it } from 'vitest';

import {
  MAX_PLUGIN_TREE_NODES,
  validatePluginTree,
} from './validate-plugin-tree';

describe('validatePluginTree', () => {
  it('accepts a valid tree', () => {
    const result = validatePluginTree({
      type: 'Panel',
      props: { title: 'Assets' },
      children: [{ type: 'Text', props: { tone: 'muted' }, children: ['Hi'] }],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.nodeCount).toBe(2);
      expect(result.root.type).toBe('Panel');
    }
  });

  it('rejects unknown element types', () => {
    const result = validatePluginTree({
      type: 'Script',
      props: {},
      children: [],
    });
    expect(result).toEqual({ ok: false, reason: 'Invalid plugin tree' });
  });

  it('rejects oversized trees', () => {
    let node: Record<string, unknown> = {
      type: 'Text',
      props: {},
      children: ['x'],
    };
    for (let i = 0; i < MAX_PLUGIN_TREE_NODES + 2; i += 1) {
      node = { type: 'Stack', props: {}, children: [node] };
    }
    const result = validatePluginTree(node);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/node count|Invalid/);
    }
  });
});
