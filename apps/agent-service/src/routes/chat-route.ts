import { zValidator } from '@hono/zod-validator';
import { toAISdkStream } from '@mastra/ai-sdk';
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';
import type { Hono } from 'hono';

import {
  createOpenEnvxSupervisorAgent,
  formatSceneContext,
  type ReasoningEffort,
} from '../agents/create-openenvx-agent';
import type { AgentServiceBindings } from '../app-bindings';
import {
  assertThreadOwned,
  ThreadNotFoundError,
} from '../memory/assert-thread-owned';
import { createMemory } from '../memory/create-memory';
import {
  getProposalStore,
  setSceneContext,
  setTaskEmitter,
} from '../request-context';
import { chatRequestSchema } from '../schemas/chat-request';

const REASONING_EFFORTS = new Set<ReasoningEffort>([
  'none',
  'minimal',
  'low',
  'medium',
  'high',
  'xhigh',
  'max',
]);

function parseReasoningEffort(
  value: string | undefined
): ReasoningEffort | undefined {
  if (!value) {
    return undefined;
  }
  return REASONING_EFFORTS.has(value as ReasoningEffort)
    ? (value as ReasoningEffort)
    : undefined;
}

function parseReasoningMaxTokens(
  value: string | undefined
): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function registerChatRoute(
  app: Hono<{ Bindings: AgentServiceBindings }>
): void {
  app.post(
    '/api/agent/chat',
    zValidator('json', chatRequestSchema),
    async (context) => {
      const apiKey = context.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        return context.json(
          { error: 'OPENROUTER_API_KEY is not configured' },
          503
        );
      }

      const { messages, sceneContext, sceneId, threadId } =
        context.req.valid('json');
      const requestToken = {};
      setSceneContext(requestToken, sceneContext);

      const memory = await createMemory(context.env.DB);

      if (memory && sceneId && threadId) {
        try {
          await assertThreadOwned(memory, threadId, sceneId);
        } catch (error) {
          if (error instanceof ThreadNotFoundError) {
            return context.json({ error: 'Thread not found' }, 404);
          }
          throw error;
        }
      }

      const agent = createOpenEnvxSupervisorAgent({
        apiKey,
        modelId: context.env.OPENROUTER_MODEL,
        mediaModelId: context.env.OPENROUTER_MEDIA_MODEL,
        imageModelId: context.env.OPENROUTER_IMAGE_MODEL,
        requestToken,
        memory,
        media: {
          assets: context.env.ASSETS,
          publicBaseUrl:
            context.env.ASSET_PUBLIC_BASE_URL ??
            new URL(context.req.url).origin,
          unsplashAccessKey: context.env.UNSPLASH_ACCESS_KEY,
        },
        reasoningEffort: parseReasoningEffort(
          context.env.OPENROUTER_REASONING_EFFORT
        ),
        reasoningMaxTokens: parseReasoningMaxTokens(
          context.env.OPENROUTER_REASONING_MAX_TOKENS
        ),
      });

      const coreMessages = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      const lastUserIndex = [...coreMessages]
        .map((message, index) => ({ message, index }))
        .toReversed()
        .find(({ message }) => message.role === 'user')?.index;

      const enrichedMessages =
        sceneContext && lastUserIndex !== undefined
          ? coreMessages.map((message, index) =>
              index === lastUserIndex
                ? {
                    ...message,
                    content: `${message.content}\n\n---\nCurrent scene context:\n${formatSceneContext(sceneContext)}`,
                  }
                : message
            )
          : coreMessages;

      const useMemory = Boolean(memory && sceneId && threadId);

      // When Memory is enabled, send only the latest user turn (Memory loads history).
      const streamMessages =
        useMemory && lastUserIndex !== undefined
          ? [enrichedMessages[lastUserIndex]!]
          : enrichedMessages;

      const streamOptions = useMemory
        ? {
            memory: {
              thread: threadId!,
              resource: sceneId!,
            },
          }
        : {};

      const stream = await agent.stream(
        streamMessages as Parameters<typeof agent.stream>[0],
        streamOptions
      );

      const uiStream = createUIMessageStream({
        execute: async ({ writer }) => {
          setTaskEmitter(requestToken, (event) => {
            writer.write({
              type: 'data-agent-task',
              id: event.taskId,
              data: event,
            });
          });

          const aiStream = toAISdkStream(stream, {
            from: 'agent',
            sendReasoning: true,
          });
          writer.merge(aiStream as Parameters<typeof writer.merge>[0]);

          await stream.finishReason.catch(() => stream._waitUntilFinished());

          const proposedChanges = getProposalStore(requestToken);
          if (proposedChanges.length > 0) {
            writer.write({
              type: 'data-proposed-changes',
              data: {
                changes: proposedChanges,
                summary: `${proposedChanges.length} proposed change(s)`,
              },
            });
          }

          setTaskEmitter(requestToken, undefined);
        },
      });

      return createUIMessageStreamResponse({ stream: uiStream });
    }
  );
}
