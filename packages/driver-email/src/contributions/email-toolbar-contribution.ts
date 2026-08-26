import {
  ToolbarContribution,
  type CommandContext,
  type ToolbarBuilder,
} from '@openenvx/core';
import { formatVariableToken } from '@openenvx/core/schema';

const EMAIL_EDIT_WHEN = "page.layout == 'email' && email.modeEdit";

export class EmailToolbarContribution extends ToolbarContribution {
  contribute(builder: ToolbarBuilder, ctx: CommandContext): void {
    const variables = ctx.scene.getScene().variables ?? [];

    builder
      .placement('bottom-center')
      .command('email-toolbar-undo', {
        commandId: 'scene.undo',
        icon: 'undo',
        labelKey: 'toolbar.undo',
        priority: 0,
        when: EMAIL_EDIT_WHEN,
      })
      .command('email-toolbar-redo', {
        commandId: 'scene.redo',
        icon: 'redo',
        labelKey: 'toolbar.redo',
        priority: 1,
        when: EMAIL_EDIT_WHEN,
      })
      .separator('email-toolbar-separator-1', {
        priority: 2,
        when: EMAIL_EDIT_WHEN,
      })
      .dropdown('email-toolbar-text', {
        icon: 'text',
        labelKey: 'toolbar.textTool',
        priority: 10,
        when: EMAIL_EDIT_WHEN,
        items: [
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.text' },
            labelKey: 'toolbar.emailText',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.heading', data: { level: '1' } },
            labelKey: 'toolbar.emailTitle',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.heading', data: { level: '2' } },
            labelKey: 'toolbar.emailSubtitle',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.heading', data: { level: '3' } },
            labelKey: 'toolbar.emailHeading',
          },
        ],
      })
      .command('email-toolbar-image', {
        commandId: 'email.insertBlock',
        args: { type: 'email.image' },
        icon: 'image',
        labelKey: 'toolbar.imageTool',
        priority: 11,
        when: EMAIL_EDIT_WHEN,
      })
      .dropdown('email-toolbar-layout', {
        icon: 'grid',
        labelKey: 'toolbar.emailLayout',
        priority: 12,
        when: EMAIL_EDIT_WHEN,
        items: [
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.section' },
            labelKey: 'toolbar.emailSection',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.row' },
            labelKey: 'toolbar.emailRow',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.column' },
            labelKey: 'toolbar.emailColumn',
          },
          {
            commandId: 'email.insertBlock',
            args: { type: 'email.button' },
            labelKey: 'toolbar.emailButton',
          },
        ],
      })
      .dropdown('email-toolbar-variables', {
        icon: 'braces',
        labelKey: 'toolbar.variables',
        priority: 13,
        when: EMAIL_EDIT_WHEN,
        items: [
          ...variables.map((variable) => ({
            commandId: 'scene.insertVariable',
            args: { key: variable.key },
            label: formatVariableToken(variable.key),
          })),
          {
            commandId: 'workbench.createVariable',
            labelKey: 'toolbar.createVariable',
          },
        ],
      });
  }
}
