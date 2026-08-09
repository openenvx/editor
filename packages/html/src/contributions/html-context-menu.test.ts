import { createMenuBuilder } from '@openenvx/core';
import { describe, expect, it } from 'vitest';

import { HtmlContextMenu } from './html-context-menu';

describe('HtmlContextMenu', () => {
  it('contributes block and page commands with when clauses', () => {
    const builder = createMenuBuilder();
    new HtmlContextMenu().contribute(builder, {
      canExecute: () => true,
      t: (_key, defaultValue) => defaultValue ?? _key,
    });

    const items = builder.build();
    expect(items).toEqual([
      {
        commandId: 'html.duplicateBlock',
        label: 'Duplicate',
        when: 'scene.layerSelected',
      },
      {
        commandId: 'html.removeBlock',
        label: 'Delete',
        when: 'scene.layerSelected',
      },
      {
        commandId: 'html.moveBlockUp',
        label: 'Move up',
        when: 'scene.layerSelected',
      },
      {
        commandId: 'html.moveBlockDown',
        label: 'Move down',
        when: 'scene.layerSelected',
      },
      {
        commandId: 'scene.addPage',
        label: 'Add page',
        when: '!scene.layerSelected',
      },
      {
        commandId: 'scene.duplicatePage',
        label: 'Duplicate page',
        when: '!scene.layerSelected',
      },
      {
        commandId: 'scene.removePage',
        label: 'Delete page',
        when: '!scene.layerSelected && scene.multiPage',
      },
    ]);
  });
});
