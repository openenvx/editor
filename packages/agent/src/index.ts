export { AgentChatPlugin } from './plugin/agent-plugin';
export { AgentChatContainer } from './contributions/agent-sidebar-contribution';
export { ChatPanel } from './components/chat-panel';
export { AgentTaskBoard } from './components/agent-task-board';
export { ProposalCard } from './components/proposal-card';
export { applyProposedChanges } from './proposal/apply-proposal';
export {
  AGENT_CHAT_CONTAINER_ID,
  AGENT_COMMAND_CATALOG,
  agentTaskEventSchema,
  proposedChangeSchema,
  proposedChangesPayloadSchema,
  type AgentTaskEvent,
  type ProposedChange,
  type ProposedChangesPayload,
} from './schemas/proposed-changes';
export {
  DEFAULT_THREAD_TITLE,
  truncateThreadTitle,
} from './schemas/thread-title';

import { AgentChatPlugin } from './plugin/agent-plugin';

export const DEFAULT_AGENT_PLUGINS = [new AgentChatPlugin()];
