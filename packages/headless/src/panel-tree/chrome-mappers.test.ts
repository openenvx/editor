import { describe, expect, it } from 'vitest';

import { n } from './test-node';

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
      n(
        'Menu',
        null,
        n('RadioGroup', {
          id: 'theme',
          providerId: 'workbench.theme',
          label: 'Theme',
        }),
        n('Separator', { id: 'file-separator' }),
        n('Item', {
          commandId: 'workbench.save',
          label: 'Save',
          shortcut: 'Mod+S',
        }),
        n(
          'Submenu',
          { id: 'workbench.export', label: 'Export' },
          n('Item', { commandId: 'export.png', label: 'PNG' }),
          n('Item', { commandId: 'export.svg', label: 'SVG' })
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
      n(
        'Toolbar',
        null,
        n('ToolbarCommand', {
          id: 'undo',
          commandId: 'scene.undo',
          icon: 'undo',
          labelKey: 'toolbar.undo',
          priority: 0,
        }),
        n('Separator', { id: 'sep', priority: 2 }),
        n(
          'ToolbarDropdown',
          {
            id: 'zoom',
            labelBinding: 'editorZoomPercent',
            labelSuffix: '%',
            priority: 22,
          },
          n('Item', {
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
      n(
        'StatusBar',
        null,
        n(
          'StatusBarDropdown',
          {
            id: 'zoom',
            alignment: 'left',
            labelBinding: 'editorZoomPercent',
            labelSuffix: '%',
            priority: -10,
          },
          n('Item', { commandId: 'canvas.zoomIn', labelKey: 'zoom.in' })
        ),
        n('StatusBarText', {
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
      n(
        'Palette',
        null,
        n('PaletteCategory', { id: 'file', label: 'File' }),
        n('PaletteItem', {
          commandId: 'workbench.save',
          category: 'file',
          shortcut: 'Mod+S',
        }),
        n('PaletteItem', { commandId: 'hidden.cmd', hidden: true })
      )
    );

    expect(viaTree).toEqual(viaBuilder.build());
  });
});
