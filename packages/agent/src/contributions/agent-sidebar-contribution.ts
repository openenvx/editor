import { ViewContainerContribution } from '@openenvx/headless';

import { AGENT_CHAT_CONTAINER_ID } from '../schemas/proposed-changes';

export class AgentChatContainer extends ViewContainerContribution {
  readonly id = AGENT_CHAT_CONTAINER_ID;
  readonly title = 'Agent';
  readonly icon = 'sparkles';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 20;
}
