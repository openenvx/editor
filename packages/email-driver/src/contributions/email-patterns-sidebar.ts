import { ViewContainerContribution, ViewContribution } from '@openenvx/core';

export const EMAIL_PATTERNS_CONTAINER_ID = 'email.patterns';
export const EMAIL_PATTERNS_VIEW_ID = 'email.patterns.gallery';
export const EMAIL_PATTERNS_PANEL_COMPONENT_ID = 'email.patterns.gallery';
export const EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID = 'email.openBlocksSheet';
export const EMAIL_BLOCKS_SHEET_OPEN_KEY = 'email.blocksSheetOpen';

const EMAIL_LAYOUT = "page.layout == 'email'";

/**
 * Activity-bar item that opens the Blocks gallery sheet (command, not a docked panel).
 * Sheet chrome is hosted by workbench; this package registers gallery content only.
 */
export class EmailPatternsContainer extends ViewContainerContribution {
  readonly id = EMAIL_PATTERNS_CONTAINER_ID;
  readonly title = 'Blocks';
  readonly icon = 'boxes';
  readonly sidebarBehavior = 'command' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 12;
  readonly commandId = EMAIL_OPEN_BLOCKS_SHEET_COMMAND_ID;
  readonly sheetOpenKey = EMAIL_BLOCKS_SHEET_OPEN_KEY;
  readonly sheetDescription = 'Insert a predefined email section.';
  readonly when = EMAIL_LAYOUT;
}

export class EmailPatternsView extends ViewContribution {
  readonly id = EMAIL_PATTERNS_VIEW_ID;
  readonly containerId = EMAIL_PATTERNS_CONTAINER_ID;
  readonly name = 'Blocks';
  readonly componentId = EMAIL_PATTERNS_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly when = EMAIL_LAYOUT;
}
