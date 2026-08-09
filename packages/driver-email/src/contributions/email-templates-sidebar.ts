import { ViewContainerContribution, ViewContribution } from '@openenvx/core';

export const EMAIL_TEMPLATES_CONTAINER_ID = 'email.templates';
export const EMAIL_TEMPLATES_VIEW_ID = 'email.templates.gallery';
export const EMAIL_TEMPLATES_PANEL_COMPONENT_ID = 'email.templates.gallery';
export const EMAIL_OPEN_TEMPLATES_SHEET_COMMAND_ID = 'email.openTemplatesSheet';
export const EMAIL_TEMPLATES_SHEET_OPEN_KEY = 'email.templatesSheetOpen';

const EMAIL_LAYOUT = "page.layout == 'email'";

/**
 * Activity-bar item that opens the Templates gallery sheet (command, not a docked panel).
 * Sheet chrome is hosted by workbench; this package registers gallery content only.
 */
export class EmailTemplatesContainer extends ViewContainerContribution {
  readonly id = EMAIL_TEMPLATES_CONTAINER_ID;
  readonly title = 'Templates';
  readonly icon = 'folder';
  readonly sidebarBehavior = 'command' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 11;
  readonly commandId = EMAIL_OPEN_TEMPLATES_SHEET_COMMAND_ID;
  readonly sheetOpenKey = EMAIL_TEMPLATES_SHEET_OPEN_KEY;
  readonly sheetDescription = 'Start from a full email template.';
  readonly when = EMAIL_LAYOUT;
}

export class EmailTemplatesView extends ViewContribution {
  readonly id = EMAIL_TEMPLATES_VIEW_ID;
  readonly containerId = EMAIL_TEMPLATES_CONTAINER_ID;
  readonly name = 'Templates';
  readonly componentId = EMAIL_TEMPLATES_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
  readonly when = EMAIL_LAYOUT;
}
