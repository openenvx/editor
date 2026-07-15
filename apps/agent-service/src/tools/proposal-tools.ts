import { createTool } from '@mastra/core/tools';
import {
  normalizeCreateLayerChange,
  proposedChangeSchema,
  type ProposedChange,
} from '@openenvx/agent/schemas';
import { z } from 'zod';

import { getProposalStore } from '../request-context';

function acceptChange(change: ProposedChange): ProposedChange {
  if (change.kind === 'createLayer') {
    return normalizeCreateLayerChange(change);
  }
  return change;
}

/**
 * Keep tool inputSchema as plain ZodObject fields.
 * Nested discriminatedUnion / .min(1) can force Mastra onto the AJV JSON Schema
 * path, which uses `new Function()` and fails on Cloudflare Workers.
 */
export function createProposalTools(requestToken: object) {
  const store = getProposalStore(requestToken);

  const proposeChanges = createTool({
    id: 'propose-changes',
    description:
      'Propose a batch of scene changes for the user to apply. Each change maps to a workbench command, property update, create, or delete. Each item needs a kind of executeCommand | updateProperty | selectLayers | createLayer | deleteLayer.',
    inputSchema: z.object({
      changes: z
        .array(z.record(z.string(), z.unknown()))
        .describe('Array of proposed change objects'),
      summary: z
        .string()
        .describe('Brief human-readable summary of the proposal'),
    }),
    execute: async ({ changes, summary }) => {
      if (changes.length === 0) {
        return { accepted: false, error: 'changes must not be empty' };
      }
      const parsed: ProposedChange[] = [];
      for (const change of changes) {
        const result = proposedChangeSchema.safeParse(change);
        if (!result.success) {
          return {
            accepted: false,
            error: `Invalid change: ${result.error.message}`,
          };
        }
        parsed.push(acceptChange(result.data));
      }
      store.push(...parsed);
      return {
        accepted: true,
        changeCount: parsed.length,
        summary,
      };
    },
  });

  const executeCommand = createTool({
    id: 'propose-execute-command',
    description: 'Propose running a single workbench command on the scene',
    inputSchema: z.object({
      commandId: z.string(),
      args: z.unknown().optional(),
      label: z.string().optional(),
    }),
    execute: async ({ commandId, args, label }) => {
      const change: ProposedChange = {
        kind: 'executeCommand',
        commandId,
        args,
        label: label ?? commandId,
      };
      store.push(change);
      return { accepted: true, change };
    },
  });

  const updateProperty = createTool({
    id: 'propose-update-property',
    description: 'Propose updating a layer property value',
    inputSchema: z.object({
      layerId: z.string(),
      key: z.string(),
      value: z.unknown(),
      label: z.string().optional(),
    }),
    execute: async ({ layerId, key, value, label }) => {
      const change: ProposedChange = {
        kind: 'updateProperty',
        layerId,
        key,
        value,
        label: label ?? `Update ${key}`,
      };
      store.push(change);
      return { accepted: true, change };
    },
  });

  const createLayer = createTool({
    id: 'propose-create-layer',
    description:
      'Propose creating a new layer on the active page. Use exact types: canvas.text, canvas.rect, canvas.image, canvas.group, canvas.circle. For canvas.text, data.html is required (wrap copy in <p>…</p>); use align not textAlign.',
    inputSchema: z.object({
      type: z
        .string()
        .describe(
          'Exact layer type: canvas.text | canvas.rect | canvas.image | canvas.group | canvas.circle'
        ),
      id: z.string().optional(),
      parentId: z
        .string()
        .optional()
        .describe('Optional container/group parent id'),
      transform: z.record(z.string(), z.unknown()).optional(),
      data: z.unknown().optional(),
      label: z.string().optional(),
    }),
    execute: async ({ type, id, parentId, transform, data, label }) => {
      const change = acceptChange({
        kind: 'createLayer',
        type,
        id,
        parentId,
        transform,
        data,
        label: label ?? `Create ${type}`,
      });
      store.push(change);
      return { accepted: true, change };
    },
  });

  const deleteLayer = createTool({
    id: 'propose-delete-layer',
    description: 'Propose deleting one or more layers by id',
    inputSchema: z.object({
      layerIds: z.array(z.string()).describe('Layer ids to delete'),
      label: z.string().optional(),
    }),
    execute: async ({ layerIds, label }) => {
      if (layerIds.length === 0) {
        return { accepted: false, error: 'layerIds must not be empty' };
      }
      const change: ProposedChange = {
        kind: 'deleteLayer',
        layerIds,
        label: label ?? `Delete ${layerIds.length} layer(s)`,
      };
      store.push(change);
      return { accepted: true, change };
    },
  });

  return {
    proposeChanges,
    proposeExecuteCommand: executeCommand,
    proposeUpdateProperty: updateProperty,
    proposeCreateLayer: createLayer,
    proposeDeleteLayer: deleteLayer,
  };
}
