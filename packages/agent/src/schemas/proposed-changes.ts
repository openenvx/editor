import { z } from 'zod';

export const executeCommandChangeSchema = z.object({
  kind: z.literal('executeCommand'),
  commandId: z.string(),
  args: z.unknown().optional(),
  label: z.string().optional(),
});

export const updatePropertyChangeSchema = z.object({
  kind: z.literal('updateProperty'),
  layerId: z.string(),
  key: z.string(),
  value: z.unknown(),
  label: z.string().optional(),
});

export const selectLayersChangeSchema = z.object({
  kind: z.literal('selectLayers'),
  layerIds: z.array(z.string()),
  primaryLayerId: z.string().nullable().optional(),
  label: z.string().optional(),
});

export const createLayerChangeSchema = z.object({
  kind: z.literal('createLayer'),
  type: z.string(),
  id: z.string().optional(),
  parentId: z.string().optional(),
  transform: z.record(z.string(), z.unknown()).optional(),
  data: z.unknown().optional(),
  label: z.string().optional(),
});

export const deleteLayerChangeSchema = z.object({
  kind: z.literal('deleteLayer'),
  layerIds: z.array(z.string()).min(1),
  label: z.string().optional(),
});

export const proposedChangeSchema = z.discriminatedUnion('kind', [
  executeCommandChangeSchema,
  updatePropertyChangeSchema,
  selectLayersChangeSchema,
  createLayerChangeSchema,
  deleteLayerChangeSchema,
]);

export const proposedChangesPayloadSchema = z.object({
  changes: z.array(proposedChangeSchema),
  summary: z.string().optional(),
});

export type ExecuteCommandChange = z.infer<typeof executeCommandChangeSchema>;
export type UpdatePropertyChange = z.infer<typeof updatePropertyChangeSchema>;
export type SelectLayersChange = z.infer<typeof selectLayersChangeSchema>;
export type CreateLayerChange = z.infer<typeof createLayerChangeSchema>;
export type DeleteLayerChange = z.infer<typeof deleteLayerChangeSchema>;
export type ProposedChange = z.infer<typeof proposedChangeSchema>;
export type ProposedChangesPayload = z.infer<
  typeof proposedChangesPayloadSchema
>;

export const AGENT_COMMAND_CATALOG = {
  alignLeft: 'canvas.alignLeft',
  alignCenter: 'canvas.alignCenter',
  alignRight: 'canvas.alignRight',
  alignTop: 'canvas.alignTop',
  alignMiddle: 'canvas.alignMiddle',
  alignBottom: 'canvas.alignBottom',
  distributeHorizontal: 'canvas.distributeHorizontal',
  toggleLayerLock: 'scene.toggleLayerLock',
  deleteLayer: 'scene.deleteLayer',
} as const;

export type AgentCommandId =
  (typeof AGENT_COMMAND_CATALOG)[keyof typeof AGENT_COMMAND_CATALOG];

export const AGENT_CHAT_CONTAINER_ID = 'agent.chat';

export const agentTaskEventSchema = z.object({
  taskId: z.string(),
  agentId: z.string(),
  label: z.string(),
  status: z.enum(['pending', 'running', 'complete', 'error']),
  summary: z.string().optional(),
});

export type AgentTaskEvent = z.infer<typeof agentTaskEventSchema>;
