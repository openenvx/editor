import { normalizeDocument } from '@openenvx/editor/schema';
import { describe, expect, it } from 'vitest';

import { createMockCommandContext } from '../../test/mock-command-context';
import { VariablesTreeProvider } from './variables-tree-provider';

describe('VariablesTreeProvider', () => {
  it('maps variables to list tree items with edit action', () => {
    const provider = new VariablesTreeProvider();
    const scene = normalizeDocument({
      pages: [{ id: 'p1', name: 'Canvas', layout: 'absolute', layers: [] }],
      variables: [{ id: 'v1', key: 'name' }],
    });
    const { ctx } = createMockCommandContext(scene);

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
