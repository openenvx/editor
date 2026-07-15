import {
  DEFAULT_THREAD_TITLE,
  truncateThreadTitle,
} from '@openenvx/agent/schemas';

export const SCENE_CONTEXT_MARKER = '\n\n---\nCurrent scene context:';

export { DEFAULT_THREAD_TITLE, truncateThreadTitle };

export interface HistoryUiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: { type: string; [key: string]: unknown }[];
}

interface MastraHistoryMessage {
  id: string;
  role: string;
  content?: {
    parts?: { type: string; text?: string; [key: string]: unknown }[];
    content?: string;
  };
}

export function stripSceneContextSuffix(text: string): string {
  const index = text.indexOf(SCENE_CONTEXT_MARKER);
  if (index === -1) {
    return text;
  }
  return text.slice(0, index).trimEnd();
}

function mapPart(part: {
  type: string;
  text?: string;
  [key: string]: unknown;
}): { type: string; [key: string]: unknown } {
  if (part.type === 'text' && typeof part.text === 'string') {
    return {
      ...part,
      text: stripSceneContextSuffix(part.text),
    };
  }
  return part;
}

/**
 * Maps Mastra D1 recall messages into AI SDK UIMessage-shaped JSON for the chat UI.
 */
export function mapHistoryMessagesToUi(
  messages: MastraHistoryMessage[]
): HistoryUiMessage[] {
  const result: HistoryUiMessage[] = [];

  for (const message of messages) {
    if (
      message.role !== 'user' &&
      message.role !== 'assistant' &&
      message.role !== 'system'
    ) {
      continue;
    }

    const rawParts = message.content?.parts;
    let parts: HistoryUiMessage['parts'];

    if (Array.isArray(rawParts) && rawParts.length > 0) {
      parts = rawParts.map(mapPart);
    } else if (typeof message.content?.content === 'string') {
      parts = [
        {
          type: 'text',
          text: stripSceneContextSuffix(message.content.content),
        },
      ];
    } else {
      parts = [];
    }

    if (parts.length === 0) {
      continue;
    }

    result.push({
      id: message.id,
      role: message.role,
      parts,
    });
  }

  return result;
}
