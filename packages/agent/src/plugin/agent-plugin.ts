import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import { AgentChatContainer } from '../contributions/agent-sidebar-contribution';

export class AgentChatPlugin extends WorkbenchPlugin {
  readonly id = 'openenvx.agent.chat';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new AgentChatContainer());
  }
}
