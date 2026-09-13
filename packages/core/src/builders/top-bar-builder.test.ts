import { describe, expect, it } from 'vitest';

import { createTopBarBuilder, isTopBarGroupItem } from './top-bar-builder';

describe('TopBarBuilder', () => {
  it('builds left/center/right items with groups', () => {
    const items = createTopBarBuilder()
      .placement('left')
      .title('title', { titleBinding: 'editorTitle', priority: 0 })
      .end()
      .placement('center')
      .group('modes', {
        groupVariant: 'segmented',
        items: [
          {
            commandId: 'email.enterEditMode',
            id: 'mode-edit',
            label: 'Editor',
            placement: 'center',
            toggledWhen: 'email.modeEdit',
          },
        ],
        priority: 0,
      })
      .end()
      .placement('right')
      .command('save', {
        commandId: 'workbench.save',
        label: 'Save',
        priority: 0,
        variant: 'primary',
      })
      .build();

    expect(items.map((item) => item.id)).toEqual(['title', 'modes', 'save']);
    expect(items[1]?.placement).toBe('center');
    expect(isTopBarGroupItem(items[1]!)).toBe(true);
  });
});
