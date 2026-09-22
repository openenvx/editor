import type { CommandContext } from '#studio';
import { normalizeScene } from '#studio/schema';
import { describe, expect, it } from 'vitest';

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
      pages: [{ id: 'p1', name: 'Canvas', layout: 'absolute', layers: [] }],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const ctx = createCtx(scene);

    const roots = provider.getRootChildren(ctx);
    expect(roots).toHaveLength(1);

    const item = provider.getTreeItem(roots[0]!, ctx);
    expect(item).toMatchObject({
      id: 'v1',
      label: 'name',
      actions: [
        {
          commandId: 'variables.edit',
          icon: 'pencil',
          label: 'Edit variable',
        },
      ],
    });
  });

});
