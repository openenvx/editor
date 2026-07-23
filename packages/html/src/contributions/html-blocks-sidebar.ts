import {
  ViewContainerContribution,
  ViewContribution,
} from '@openenvx/headless';

export const HTML_BLOCKS_CONTAINER_ID = 'html.blocks';
export const HTML_BLOCKS_VIEW_ID = 'html.blocks.palette';
export const HTML_BLOCKS_PANEL_COMPONENT_ID = 'html.blocks.palette';

/** Activity-sidebar panel for the HTML block palette (primary, next to Layers). */
export class HtmlBlocksContainer extends ViewContainerContribution {
  readonly id = HTML_BLOCKS_CONTAINER_ID;
  readonly title = 'Blocks';
  readonly icon = 'boxes';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 12;
}

export class HtmlBlocksView extends ViewContribution {
  readonly id = HTML_BLOCKS_VIEW_ID;
  readonly containerId = HTML_BLOCKS_CONTAINER_ID;
  readonly name = 'Blocks';
  readonly componentId = HTML_BLOCKS_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}
