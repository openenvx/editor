import { ViewContainerContribution } from '@openenvx/headless';

export const EMAIL_PATTERNS_CONTAINER_ID = 'email.patterns';
export const EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID = 'email.openBlocksSheet';
export const EMAIL_BLOCKS_SHEET_OPEN_KEY = 'email.blocksSheetOpen';

const EMAIL_LAYOUT = "page.layout == 'email'";

/**
 * Activity-bar item that opens the Blocks gallery sheet (command, not a docked panel).
 */
export class EmailPatternsContainer extends ViewContainerContribution {
  readonly id = EMAIL_PATTERNS_CONTAINER_ID;
  readonly title = 'Blocks';
  readonly icon = 'boxes';
  readonly sidebarBehavior = 'command' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 12;
  readonly commandId = EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID;
  readonly when = EMAIL_LAYOUT;
}
