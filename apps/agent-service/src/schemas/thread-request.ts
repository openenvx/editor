import { z } from 'zod';

export const listThreadsQuerySchema = z.object({
  sceneId: z.string().min(1),
});

export const createThreadBodySchema = z.object({
  sceneId: z.string().min(1),
  title: z.string().min(1).max(200).optional(),
});

export const threadMessagesQuerySchema = z.object({
  sceneId: z.string().min(1),
});

export const patchThreadBodySchema = z.object({
  sceneId: z.string().min(1),
  title: z.string().min(1).max(200),
});

export const deleteThreadQuerySchema = z.object({
  sceneId: z.string().min(1),
});
