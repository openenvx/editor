import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { ChatPanel } from '../components/chat-panel';
import {
  AGENT_CHAT_PANEL_COMPONENT_ID,
  AgentChatContainer,
  AgentChatView,
} from '../contributions/agent-sidebar-contribution';

export class AgentChatPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.agent.chat';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new AgentChatContainer(), new AgentChatView());
    ctx.registerViewPanel(AGENT_CHAT_PANEL_COMPONENT_ID, ChatPanel);
  }
}
