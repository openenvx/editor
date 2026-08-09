import { ViewContainerContribution, ViewContribution } from '@openenvx/core';

export const TEMPLATE_DATA_CONTAINER_ID = 'canvas.template';
export const TEMPLATE_DATA_VIEW_ID = 'canvas.template.panel';
export const TEMPLATE_DATA_PANEL_COMPONENT_ID = 'canvas.template.panel';

export class CanvasTemplateContainer extends ViewContainerContribution {
  readonly id = TEMPLATE_DATA_CONTAINER_ID;
  readonly title = 'Template';
  readonly icon = 'shapes';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 15;
}

export class CanvasTemplateView extends ViewContribution {
  readonly id = TEMPLATE_DATA_VIEW_ID;
  readonly containerId = TEMPLATE_DATA_CONTAINER_ID;
  readonly name = 'Template';
  readonly componentId = TEMPLATE_DATA_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}
