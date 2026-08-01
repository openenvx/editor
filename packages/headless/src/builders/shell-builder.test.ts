import { describe, expect, it } from 'vitest';

import {
  createSidebarHeaderBuilder,
} from './sidebar-header-builder';
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

describe('SidebarHeaderBuilder', () => {
  it('builds title menu and ordered actions', () => {
    const header = createSidebarHeaderBuilder()
      .titleBinding('editorTitle')
      .titleMenu((menu) => {
        menu.item('workbench.save').label('Save');
      })
      .action('hide', {
        commandId: 'workbench.togglePrimarySidebar',
        icon: 'panelLeft',
        label: 'Hide panels',
        priority: 20,
      })
      .action('save', {
        commandId: 'workbench.save',
        icon: 'cloudCheck',
        label: 'Save',
        priority: 10,
      })
      .showMoveMenu(false)
      .build('workbench.sidebar', -10);

    expect(header.containerId).toBe('workbench.sidebar');
    expect(header.titleBinding).toBe('editorTitle');
    expect(header.showMoveMenu).toBe(false);
    expect(header.menuItems).toHaveLength(1);
    expect(header.actions.map((a) => a.id)).toEqual(['save', 'hide']);
  });
});
