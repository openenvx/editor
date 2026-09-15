import { Command, ContextKeyServiceId } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import {
  EMAIL_BLOCKS_SHEET_OPEN_KEY,
  EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID,
} from '../contributions/email-patterns-sidebar';
import { EMAIL_TEMPLATES_SHEET_OPEN_KEY } from '../contributions/email-templates-sidebar';

/** Open (or toggle) the Blocks gallery sheet from the activity bar. */
export class OpenEmailBlocksSheetCommand extends Command {
  readonly id = EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID;

  execute(ctx: CommandContext): void {
    const keys = ctx.services.has(ContextKeyServiceId)
      ? ctx.services.get(ContextKeyServiceId)
      : null;
    if (!keys) {
      return;
    }
    const open = keys.get(EMAIL_BLOCKS_SHEET_OPEN_KEY) === true;
    if (!open) {
      keys.setContext(EMAIL_TEMPLATES_SHEET_OPEN_KEY, false);
    }
    keys.setContext(EMAIL_BLOCKS_SHEET_OPEN_KEY, !open);
  }
}
