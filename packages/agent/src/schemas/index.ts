export {
  AGENT_CHAT_CONTAINER_ID,
  AGENT_COMMAND_CATALOG,
  agentTaskEventSchema,
  createLayerChangeSchema,
  deleteLayerChangeSchema,
  executeCommandChangeSchema,
  proposedChangeSchema,
  proposedChangesPayloadSchema,
  selectLayersChangeSchema,
  updatePropertyChangeSchema,
  type AgentCommandId,
  type AgentTaskEvent,
  type CreateLayerChange,
  type DeleteLayerChange,
  type ExecuteCommandChange,
  type ProposedChange,
  type ProposedChangesPayload,
  type SelectLayersChange,
  type UpdatePropertyChange,
} from './proposed-changes';
export {
  DEFAULT_THREAD_TITLE,
  truncateThreadTitle,
} from './thread-title';
export {
  buildLayerFromChange,
  normalizeCreateLayerChange,
  normalizeLayerData,
  normalizeLayerType,
} from '../proposal/normalize-create-layer';
