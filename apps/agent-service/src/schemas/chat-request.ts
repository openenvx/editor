import { z } from 'zod';

export const chatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1),
  sceneContext: z.record(z.string(), z.unknown()).optional(),
  sceneId: z.string().min(1).optional(),
  /** Mastra Memory thread id (unique conversation under sceneId resource). */
  threadId: z.string().min(1).optional(),
  autoApply: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
