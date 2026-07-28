import {
  h,
  Item,
  Menu,
  Palette,
  PaletteCategory,
  PaletteItem,
  RadioGroup,
  Separator,
  StatusBar,
  StatusBarDropdown,
  StatusBarText,
  Submenu,
  Toolbar,
  ToolbarCommand,
  ToolbarDropdown,
} from '@xmazu/openenvxee-plugin-protocol';
import { describe, expect, it } from 'vitest';

import { createCommandPaletteBuilder } from '../builders/command-palette-builder';
import { createMenuBuilder } from '../builders/menu-builder';
import { createStatusBarBuilder } from '../builders/status-bar-builder';
import { createToolbarBuilder } from '../builders/toolbar-builder';
import { mapPluginTreeToMenu } from './map-plugin-tree-to-menu';
import { mapPluginTreeToPalette } from './map-plugin-tree-to-palette';
import { mapPluginTreeToStatusBar } from './map-plugin-tree-to-status-bar';
import { mapPluginTreeToToolbar } from './map-plugin-tree-to-toolbar';

describe('chrome mappers', () => {
  it('maps Menu trees onto MenuBuilder output', () => {
    const viaBuilder = createMenuBuilder();
    viaBuilder.radioGroup('theme', 'workbench.theme', 'Theme');
    viaBuilder.separator('file-separator');
    viaBuilder.item('workbench.save').label('Save').shortcut('Mod+S');
    viaBuilder.submenu('workbench.export', 'Export', (menu) => {
      menu.item('export.png').label('PNG');
      menu.item('export.svg').label('SVG');
    });

    const viaTree = mapPluginTreeToMenu(
      h(
        Menu,
        null,
        h(RadioGroup, {
          id: 'theme',
          providerId: 'workbench.theme',
          label: 'Theme',
        }),
        h(Separator, { id: 'file-separator' }),
        h(Item, {
          commandId: 'workbench.save',
          label: 'Save',
          shortcut: 'Mod+S',
        }),
        h(
          Submenu,
          { id: 'workbench.export', label: 'Export' },
          h(Item, { commandId: 'export.png', label: 'PNG' }),
          h(Item, { commandId: 'export.svg', label: 'SVG' })
        )
      )
    );

    expect(viaTree).toEqual(viaBuilder.build());
  });

  it('maps Toolbar trees onto ToolbarBuilder output', () => {
    const viaBuilder = createToolbarBuilder()
      .command('undo', {
        commandId: 'scene.undo',
        icon: 'undo',
        labelKey: 'toolbar.undo',
        priority: 0,
      })
      .separator('sep', { priority: 2 })
      .dropdown('zoom', {
        items: [
          { commandId: 'canvas.zoomIn', labelKey: 'zoom.in', shortcut: '⌘ =' },
        ],
        labelBinding: 'editorZoomPercent',
        labelSuffix: '%',
        priority: 22,
      });

    const viaTree = mapPluginTreeToToolbar(
      h(
        Toolbar,
        null,
        h(ToolbarCommand, {
          id: 'undo',
          commandId: 'scene.undo',
          icon: 'undo',
          labelKey: 'toolbar.undo',
          priority: 0,
        }),
        h(Separator, { id: 'sep', priority: 2 }),
        h(
          ToolbarDropdown,
          {
            id: 'zoom',
            labelBinding: 'editorZoomPercent',
            labelSuffix: '%',
            priority: 22,
          },
          h(Item, {
            commandId: 'canvas.zoomIn',
            labelKey: 'zoom.in',
            shortcut: '⌘ =',
          })
        )
      )
    );

    expect(viaTree).toEqual(viaBuilder.build());
  });

  it('maps StatusBar trees onto StatusBarBuilder output', () => {
    const viaBuilder = createStatusBarBuilder();
    viaBuilder.left().dropdown('zoom', {
      items: [{ commandId: 'canvas.zoomIn', labelKey: 'zoom.in' }],
      labelBinding: 'editorZoomPercent',
      labelSuffix: '%',
      priority: -10,
    });
    viaBuilder.right().text('Rect · 100 × 50', {
      id: 'selection',
      priority: 10,
    });

    const viaTree = mapPluginTreeToStatusBar(
      h(
        StatusBar,
        null,
        h(
          StatusBarDropdown,
          {
            id: 'zoom',
            alignment: 'left',
            labelBinding: 'editorZoomPercent',
            labelSuffix: '%',
            priority: -10,
          },
          h(Item, { commandId: 'canvas.zoomIn', labelKey: 'zoom.in' })
        ),
        h(StatusBarText, {
          id: 'selection',
          alignment: 'right',
          text: 'Rect · 100 × 50',
          priority: 10,
        })
      )
    );

    expect(viaTree).toEqual(viaBuilder.build());
  });

  it('maps Palette trees onto CommandPaletteBuilder output', () => {
    const viaBuilder = createCommandPaletteBuilder();
    viaBuilder.category('file', 'File');
    viaBuilder.item('workbench.save').category('file').shortcut('Mod+S');
    viaBuilder.item('hidden.cmd').hide();

    const viaTree = mapPluginTreeToPalette(
      h(
        Palette,
        null,
        h(PaletteCategory, { id: 'file', label: 'File' }),
        h(PaletteItem, {
          commandId: 'workbench.save',
          category: 'file',
          shortcut: 'Mod+S',
        }),
        h(PaletteItem, { commandId: 'hidden.cmd', hidden: true })
      )
    );

    expect(viaTree).toEqual(viaBuilder.build());
  });
});
