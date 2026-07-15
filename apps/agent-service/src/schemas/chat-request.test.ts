import { describe, expect, it } from 'vitest';

import { chatRequestSchema } from './chat-request';

describe('chatRequestSchema', () => {
  it('accepts threadId with sceneId', () => {
    const parsed = chatRequestSchema.parse({
      messages: [{ role: 'user', content: 'Hello' }],
      sceneId: 'scene-1',
      threadId: 'thread-1',
    });
    expect(parsed.threadId).toBe('thread-1');
    expect(parsed.sceneId).toBe('scene-1');
  });

  it('allows chat without threadId (no memory persistence)', () => {
    const parsed = chatRequestSchema.parse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(parsed.threadId).toBeUndefined();
  });
});
