import {
  TopBarContribution,
  type CommandContext,
  type TopBarBuilder,
  type TopBarCommandItemDescriptor,
} from '@openenvx/studio/core';

import {
  EMAIL_GO_BACK_COMMAND_ID,
  WORKBENCH_OPEN_COMMAND_ID,
  WORKBENCH_SAVE_AS_COMMAND_ID,
  WORKBENCH_SAVE_COMMAND_ID,
  WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID,
} from './email-chrome-commands';

const MODE_ITEMS: TopBarCommandItemDescriptor[] = [
  {
    commandId: 'email.enterEditMode',
    icon: 'pencil',
    id: 'email-topbar-mode-edit',
    label: 'Editor',
    placement: 'center',
    toggledWhen: 'email.modeEdit',
  },
  {
    commandId: 'email.enterHtmlMode',
    icon: 'braces',
    id: 'email-topbar-mode-html',
    label: 'HTML',
    placement: 'center',
    toggledWhen: 'email.modeHtml',
  },
  {
    commandId: 'email.enterPreviewMode',
    icon: 'eye',
    id: 'email-topbar-mode-preview',
    label: 'Preview',
    placement: 'center',
    toggledWhen: 'email.modePreview',
  },
];

const DEVICE_ITEMS: TopBarCommandItemDescriptor[] = [
  {
    ariaLabel: 'Desktop preview',
    commandId: 'html.setDevicePreset',
    args: { preset: 'desktop' },
    icon: 'monitor',
    id: 'email-topbar-device-desktop',
    placement: 'right',
    toggledWhen: "html.devicePreset == 'desktop'",
  },
  {
    ariaLabel: 'Mobile preview',
    commandId: 'html.setDevicePreset',
    args: { preset: 'mobile' },
    icon: 'smartphone',
    id: 'email-topbar-device-mobile',
    placement: 'right',
    toggledWhen: "html.devicePreset == 'mobile'",
  },
];

export class EmailTopBarContribution extends TopBarContribution {
  contribute(builder: TopBarBuilder, _ctx: CommandContext): void {
    builder
      .placement('left')
      .command('email-topbar-back', {
        ariaLabel: 'Back',
        commandId: EMAIL_GO_BACK_COMMAND_ID,
        hideWhenDisabled: true,
        icon: 'arrowLeft',
        priority: 0,
        variant: 'icon',
      })
      .title('email-topbar-title', {
        priority: 1,
        titleBinding: 'editorTitle',
      })
      .end()
      .placement('center')
      .group('email-topbar-modes', {
        groupVariant: 'segmented',
        items: MODE_ITEMS,
        priority: 0,
      })
      .end()
      .placement('right')
      .status('email-topbar-saved', {
        icon: 'check',
        label: 'Saved',
        priority: 0,
        when: '!editor.dirty',
      })
      .command('email-topbar-undo', {
        ariaLabel: 'Undo',
        commandId: 'scene.undo',
        icon: 'undo',
        priority: 10,
        variant: 'icon',
      })
      .command('email-topbar-redo', {
        ariaLabel: 'Redo',
        commandId: 'scene.redo',
        icon: 'redo',
        priority: 11,
        variant: 'icon',
      })
      .separator('email-topbar-separator-devices', {
        priority: 19,
        when: '!email.modeHtml',
      })
      .group('email-topbar-devices', {
        groupVariant: 'segmented',
        items: DEVICE_ITEMS,
        priority: 20,
        when: '!email.modeHtml',
      })
      .separator('email-topbar-separator-save', {
        priority: 29,
        when: '!email.modeHtml',
      })
      .command('email-topbar-save', {
        commandId: WORKBENCH_SAVE_COMMAND_ID,
        label: 'Save',
        priority: 30,
        variant: 'primary',
      })
      .dropdown('email-topbar-more', {
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
        ],
        priority: 40,
        variant: 'menu',
      });
  }
}
