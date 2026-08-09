import { ViewContainerContribution, ViewContribution } from '@openenvx/core';

import { AGENT_CHAT_CONTAINER_ID } from '../schemas/proposed-changes';

export const AGENT_CHAT_VIEW_ID = 'agent.chat.panel';
export const AGENT_CHAT_PANEL_COMPONENT_ID = 'agent.chat.panel';

export class AgentChatContainer extends ViewContainerContribution {
  readonly id = AGENT_CHAT_CONTAINER_ID;
  readonly title = 'Agent';
  readonly icon = 'sparkles';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 20;
}

export class AgentChatView extends ViewContribution {
  readonly id = AGENT_CHAT_VIEW_ID;
  readonly containerId = AGENT_CHAT_CONTAINER_ID;
  readonly name = 'Agent';
  readonly componentId = AGENT_CHAT_PANEL_COMPONENT_ID;
  readonly collapsible = false;
  readonly viewOrder = 0;
}
