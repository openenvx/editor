import type { Memory } from '@mastra/memory';

export class ThreadNotFoundError extends Error {
  constructor(threadId: string) {
    super(`Thread not found: ${threadId}`);
    this.name = 'ThreadNotFoundError';
  }
}

/**
 * Ensures a thread exists and belongs to the given scene (Mastra resourceId).
 */
export async function assertThreadOwned(
  memory: Memory,
  threadId: string,
  sceneId: string
) {
  const existing = await memory.getThreadById({
    threadId,
    resourceId: sceneId,
  });
  if (!existing || existing.resourceId !== sceneId) {
    throw new ThreadNotFoundError(threadId);
  }
  return existing;
}
