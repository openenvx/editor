import { describe, expect, it } from 'vitest';

import { chatRequestSchema, sceneContextSchema } from './chat-request';

describe('sceneContextSchema', () => {
  it('accepts a valid content scene', () => {
    const parsed = sceneContextSchema.parse({
      scene: {
        schemaVersion: 2,
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'flow',
            layers: [],
          },
        ],
      },
      activePageId: 'p1',
      selection: {
        activePageId: 'p1',
        selectedLayerIds: [],
        primaryLayerId: null,
      },
    });
    expect(parsed.scene.pages).toHaveLength(1);
  });

  it('rejects unsupported schemaVersion', () => {
    const result = sceneContextSchema.safeParse({
      scene: {
        schemaVersion: 999,
        pages: [{ id: 'p1', name: 'Page', layout: 'flow', layers: [] }],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('chatRequestSchema', () => {
  it('accepts chat without sceneContext', () => {
    const parsed = chatRequestSchema.parse({
      messages: [{ role: 'user', content: 'Hello' }],
    });
    expect(parsed.messages).toHaveLength(1);
  });
});
