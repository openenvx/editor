import { describe, expect, it } from 'vitest';

import {
  createStatusBarBuilder,
  isStatusBarDropdownItem,
} from './status-bar-builder';
import {
  createToolbarBuilder,
  isToolbarDropdownItem,
} from './toolbar-builder';

describe('StatusBarBuilder', () => {
  it('builds left and right items with alignment', () => {
    const items = createStatusBarBuilder()
      .left()
      .dropdown('zoom', {
        items: [{ commandId: 'canvas.zoomIn', labelKey: 'zoom.in' }],
        labelBinding: 'editorZoomPercent',
        labelSuffix: '%',
        priority: -10,
      })
      .end()
      .right()
      .text('Saved', { id: 'saved', when: '!editor.dirty' })
      .end()
      .build();

    expect(items).toHaveLength(2);
    expect(items[0]?.alignment).toBe('left');
    expect(isStatusBarDropdownItem(items[0]!)).toBe(true);
    expect(items[1]?.alignment).toBe('right');
    expect(items[1]?.when).toBe('!editor.dirty');
  });
});

describe('ToolbarBuilder', () => {
  it('builds command, separator, and dropdown items', () => {
    const items = createToolbarBuilder()
      .command('undo', {
        commandId: 'scene.undo',
        icon: 'undo',
        labelKey: 'toolbar.undo',
        priority: 0,
      })
      .separator('sep-1', { priority: 1 })
      .dropdown('zoom', {
        items: [{ commandId: 'canvas.zoomIn', labelKey: 'zoom.in' }],
        labelBinding: 'editorZoomPercent',
        when: 'workbench.floatingToolbar',
        priority: 2,
      })
      .build();

    expect(items).toHaveLength(3);
    expect(items[0]?.kind).toBe('command');
    expect(items[1]?.kind).toBe('separator');
    expect(isToolbarDropdownItem(items[2]!)).toBe(true);
    expect(items[2]?.when).toBe('workbench.floatingToolbar');
  });
});
