import {
  ViewContainerContribution,
  ViewContribution,
} from '@openenvx/headless';

export const EMAIL_BLOCKS_CONTAINER_ID = 'email.blocks';
export const EMAIL_BLOCKS_VIEW_ID = 'email.blocks.palette';
export const EMAIL_BLOCKS_PANEL_COMPONENT_ID = 'email.blocks.palette';

const EMAIL_LAYOUT = "page.layout == 'email'";

/** Activity-sidebar panel for the email block palette (primary, next to Layers). */
export class EmailBlocksContainer extends ViewContainerContribution {
  readonly id = EMAIL_BLOCKS_CONTAINER_ID;
  readonly title = 'Blocks';
  readonly icon = 'boxes';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 12;
  readonly when = EMAIL_LAYOUT;
}

export class EmailBlocksView extends ViewContribution {
  readonly id = EMAIL_BLOCKS_VIEW_ID;
  readonly containerId = EMAIL_BLOCKS_CONTAINER_ID;
  readonly name = 'Blocks';
  readonly componentId = EMAIL_BLOCKS_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly when = EMAIL_LAYOUT;
}
