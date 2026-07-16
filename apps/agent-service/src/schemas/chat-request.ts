import { editorStateSchemaLenient, sceneSchemaLenient } from '@openenvx/schema';
import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

/**
 * Client scene context: content Scene (validated) + optional editor state.
 * LLM/SDK consumers should send Scene alone; selection is editor UI state.
 */
export const sceneContextSchema = z.object({
  scene: sceneSchemaLenient,
  selection: editorStateSchemaLenient.optional(),
  activePageId: z.string().nullable().optional(),
  sceneId: z.string().optional(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  sceneContext: sceneContextSchema.optional(),
  sceneId: z.string().min(1).optional(),
  /** Mastra Memory thread id (unique conversation under sceneId resource). */
  threadId: z.string().min(1).optional(),
  autoApply: z.boolean().optional(),
});
