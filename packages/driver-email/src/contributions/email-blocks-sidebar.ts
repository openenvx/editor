import { ViewContainerContribution, ViewContribution } from '@openenvx/core';

export const EMAIL_ELEMENTS_CONTAINER_ID = 'email.elements';
export const EMAIL_ELEMENTS_VIEW_ID = 'email.elements.palette';
export const EMAIL_ELEMENTS_PANEL_COMPONENT_ID = 'email.elements.palette';

const EMAIL_LAYOUT = "page.layout == 'email'";

/** Activity-sidebar panel for primitive email elements (Section, Text, …). */
export class EmailElementsContainer extends ViewContainerContribution {
  readonly id = EMAIL_ELEMENTS_CONTAINER_ID;
  readonly title = 'Elements';
  readonly icon = 'shapes';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 13;
  readonly when = EMAIL_LAYOUT;
}

export class EmailElementsView extends ViewContribution {
  readonly id = EMAIL_ELEMENTS_VIEW_ID;
  readonly containerId = EMAIL_ELEMENTS_CONTAINER_ID;
  readonly name = 'Elements';
  readonly componentId = EMAIL_ELEMENTS_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly when = EMAIL_LAYOUT;
}
