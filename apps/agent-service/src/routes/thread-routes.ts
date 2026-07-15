import { zValidator } from '@hono/zod-validator';
import type { Hono } from 'hono';

import type { AgentServiceBindings } from '../app-bindings';
import {
  assertThreadOwned,
  ThreadNotFoundError,
} from '../memory/assert-thread-owned';
import { createMemory } from '../memory/create-memory';
import {
  DEFAULT_THREAD_TITLE,
  mapHistoryMessagesToUi,
} from '../memory/map-history-messages';
import {
  createThreadBodySchema,
  deleteThreadQuerySchema,
  listThreadsQuerySchema,
  patchThreadBodySchema,
  threadMessagesQuerySchema,
} from '../schemas/thread-request';

function serializeThread(thread: {
  id: string;
  title?: string;
  resourceId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}) {
  return {
    id: thread.id,
    title: thread.title ?? DEFAULT_THREAD_TITLE,
    resourceId: thread.resourceId,
    createdAt: thread.createdAt.toISOString(),
    updatedAt: thread.updatedAt.toISOString(),
    metadata: thread.metadata ?? {},
  };
}

export function registerThreadRoutes(
  app: Hono<{ Bindings: AgentServiceBindings }>
): void {
  app.get(
    '/api/agent/threads',
    zValidator('query', listThreadsQuerySchema),
    async (context) => {
      const memory = await createMemory(context.env.DB);
      if (!memory) {
        return context.json(
          { error: 'Memory (D1) is not configured', threads: [] },
          503
        );
      }

      const { sceneId } = context.req.valid('query');
      const { threads } = await memory.listThreads({
        filter: { resourceId: sceneId },
        orderBy: { field: 'updatedAt', direction: 'DESC' },
        perPage: 50,
      });

      return context.json({ threads: threads.map(serializeThread) });
    }
  );

  app.post(
    '/api/agent/threads',
    zValidator('json', createThreadBodySchema),
    async (context) => {
      const memory = await createMemory(context.env.DB);
      if (!memory) {
        return context.json({ error: 'Memory (D1) is not configured' }, 503);
      }

      const { sceneId, title } = context.req.valid('json');
      const thread = await memory.createThread({
        resourceId: sceneId,
        title: title ?? DEFAULT_THREAD_TITLE,
      });

      return context.json({ thread: serializeThread(thread) }, 201);
    }
  );

  app.get(
    '/api/agent/threads/:threadId/messages',
    zValidator('query', threadMessagesQuerySchema),
    async (context) => {
      const memory = await createMemory(context.env.DB);
      if (!memory) {
        return context.json(
          { error: 'Memory (D1) is not configured', messages: [] },
          503
        );
      }

      const threadId = context.req.param('threadId');
      const { sceneId } = context.req.valid('query');

      try {
        await assertThreadOwned(memory, threadId, sceneId);
      } catch (error) {
        if (error instanceof ThreadNotFoundError) {
          return context.json({ error: 'Thread not found', messages: [] }, 404);
        }
        throw error;
      }

      const { messages } = await memory.recall({
        threadId,
        resourceId: sceneId,
        perPage: false,
        orderBy: { field: 'createdAt', direction: 'ASC' },
      });

      return context.json({
        messages: mapHistoryMessagesToUi(messages),
      });
    }
  );

  app.patch(
    '/api/agent/threads/:threadId',
    zValidator('json', patchThreadBodySchema),
    async (context) => {
      const memory = await createMemory(context.env.DB);
      if (!memory) {
        return context.json({ error: 'Memory (D1) is not configured' }, 503);
      }

      const threadId = context.req.param('threadId');
      const { sceneId, title } = context.req.valid('json');

      let existing;
      try {
        existing = await assertThreadOwned(memory, threadId, sceneId);
      } catch (error) {
        if (error instanceof ThreadNotFoundError) {
          return context.json({ error: 'Thread not found' }, 404);
        }
        throw error;
      }

      const thread = await memory.updateThread({
        id: threadId,
        title,
        metadata: existing.metadata ?? {},
      });

      return context.json({ thread: serializeThread(thread) });
    }
  );

  app.delete(
    '/api/agent/threads/:threadId',
    zValidator('query', deleteThreadQuerySchema),
    async (context) => {
      const memory = await createMemory(context.env.DB);
      if (!memory) {
        return context.json({ error: 'Memory (D1) is not configured' }, 503);
      }

      const threadId = context.req.param('threadId');
      const { sceneId } = context.req.valid('query');

      try {
        await assertThreadOwned(memory, threadId, sceneId);
      } catch (error) {
        if (error instanceof ThreadNotFoundError) {
          return context.json({ error: 'Thread not found' }, 404);
        }
        throw error;
      }

      await memory.deleteThread(threadId);
      return context.json({ ok: true });
    }
  );
}
