import { normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import type { CommandContext } from '@openenvx/core';
import { VariablesTreeProvider } from './variables-tree-provider';

function createCtx(scene: ReturnType<typeof normalizeScene>): CommandContext {
  const current = scene;
  return {
    scene: {
      apply: ({ apply }: { apply: (scene: typeof current) => typeof current }) => {
        Object.assign(current, apply(current));
      },
      getScene: () => current,
    },
  } as unknown as CommandContext;
}

describe('VariablesTreeProvider', () => {
  it('maps variables to list tree items with edit action', () => {
    const provider = new VariablesTreeProvider();
    const scene = normalizeScene({
      pages: [{ id: 'p1', name: 'Email', layout: 'email', layers: [] }],
      variables: [
        { id: 'v1', key: 'name', label: 'Recipient name' },
      ],
    });
    const ctx = createCtx(scene);

    const roots = provider.getRootChildren(ctx);
    expect(roots).toHaveLength(1);

    const item = provider.getTreeItem(roots[0]!, ctx);
    expect(item).toMatchObject({
      id: 'v1',
      label: '{{{name}}}',
      description: 'Recipient name',
      actions: [
        {
          commandId: 'workbench.editVariable',
          icon: 'pencil',
          label: 'Edit variable',
        },
      ],
    });
  });

  it('reorders variables via handleMove', () => {
    const provider = new VariablesTreeProvider();
    const scene = normalizeScene({
      pages: [{ id: 'p1', name: 'Email', layout: 'email', layers: [] }],
      variables: [
        { id: 'v1', key: 'a' },
        { id: 'v2', key: 'b' },
      ],
    });
    const ctx = createCtx(scene);
    const [first, second] = provider.getRootChildren(ctx);

    provider.handleMove!(second!, first!, 'before', ctx);

    expect(scene.variables?.map((entry) => entry.id)).toEqual(['v2', 'v1']);
  });
});
