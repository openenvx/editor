import {
  TopBarContribution,
  WORKBENCH_THEME_SETTINGS_MENU_ITEM,
  type CommandContext,
  type TopBarBuilder,
} from '@openenvx/studio/core';

import {
  WORKBENCH_OPEN_COMMAND_ID,
  WORKBENCH_SAVE_AS_COMMAND_ID,
  WORKBENCH_SAVE_COMMAND_ID,
  WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID,
} from './canvas-chrome-commands';

export class CanvasTopBarContribution extends TopBarContribution {
  contribute(builder: TopBarBuilder, _ctx: CommandContext): void {
    builder
      .placement('left')
      .title('canvas-topbar-title', {
        priority: 0,
        titleBinding: 'editorTitle',
      })
      .end()
      .placement('right')
      .status('canvas-topbar-saved', {
        icon: 'check',
        label: 'Saved',
        priority: 0,
        when: '!editor.dirty',
      })
      .command('canvas-topbar-undo', {
        ariaLabel: 'Undo',
        commandId: 'scene.undo',
        icon: 'undo',
        priority: 10,
        variant: 'icon',
      })
      .command('canvas-topbar-redo', {
        ariaLabel: 'Redo',
        commandId: 'scene.redo',
        icon: 'redo',
        priority: 11,
        variant: 'icon',
      })
      .command('canvas-topbar-save', {
        commandId: WORKBENCH_SAVE_COMMAND_ID,
        label: 'Save',
        priority: 20,
        variant: 'primary',
      })
      .dropdown('canvas-topbar-more', {
        icon: 'settings',
        items: [
          {
            commandId: WORKBENCH_OPEN_COMMAND_ID,
            label: 'Open…',
          },
          {
            commandId: WORKBENCH_SAVE_AS_COMMAND_ID,
            label: 'Save as…',
          },
          {
            commandId: WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID,
            label: 'Command palette',
          },
          WORKBENCH_THEME_SETTINGS_MENU_ITEM,
        ],
        priority: 30,
        variant: 'menu',
      });
  }
}
