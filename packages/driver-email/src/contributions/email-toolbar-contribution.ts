import type { CommandContext } from '@openenvx/core';
import { ToolbarContribution, type ToolbarBuilder } from '@openenvx/headless';

/** Edit / Preview toggles on the shared top-center overlay toolbar. */
export class EmailToolbarContribution extends ToolbarContribution {
  contribute(builder: ToolbarBuilder, _ctx: CommandContext): void {
    builder
      .placement('top-center')
      .separator('email-toolbar-sep-mode', {
        priority: 30,
        when: 'email.editorActive',
      })
      .command('email-toolbar-edit', {
        commandId: 'email.enterEditMode',
        icon: 'type',
        labelKey: 'toolbar.edit',
        priority: 31,
        toggledWhen: 'email.modeEdit',
        when: 'email.editorActive',
      })
      .command('email-toolbar-preview', {
        commandId: 'email.enterPreviewMode',
        icon: 'eye',
        labelKey: 'toolbar.preview',
        priority: 32,
        toggledWhen: 'email.modePreview',
        when: 'email.editorActive',
      });
  }
}
