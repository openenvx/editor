import { createMenuBuilder } from '@openenvx/headless';
import { describe, expect, it } from 'vitest';

import { CanvasContextMenu } from './canvas-context-menu';

describe('CanvasContextMenu', () => {
  it('contributes group/ungroup with multi-select when clauses', () => {
    const builder = createMenuBuilder();
    new CanvasContextMenu().contribute(builder, {
      canExecute: () => true,
      t: (_key, defaultValue) => defaultValue ?? _key,
    });

    const items = builder.build();
    expect(items).toContainEqual({
      commandId: 'canvas.groupSelection',
      label: 'Create group',
      when: 'page.layoutAbsolute && scene.multiSelect',
    });
    expect(items).toContainEqual({
      commandId: 'canvas.ungroup',
      label: 'Ungroup',
      when:
        "page.layoutAbsolute && scene.layerSelected && scene.primaryLayerType == 'canvas.group'",
    });
  });
});
