import { ViewContainerContribution } from '@openenvx/headless';

export const TEMPLATE_DATA_CONTAINER_ID = 'canvas.template';

export class CanvasTemplateContainer extends ViewContainerContribution {
  readonly id = TEMPLATE_DATA_CONTAINER_ID;
  readonly title = 'Template';
  readonly icon = 'shapes';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 15;
}
