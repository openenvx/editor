import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THREAD_TITLE,
  mapHistoryMessagesToUi,
  stripSceneContextSuffix,
  truncateThreadTitle,
} from './map-history-messages';

describe('stripSceneContextSuffix', () => {
  it('removes the scene context appendix', () => {
    expect(
      stripSceneContextSuffix(
        'Make the title bigger\n\n---\nCurrent scene context:\n{"layers":[]}'
      )
    ).toBe('Make the title bigger');
  });

  it('returns unchanged text when marker is absent', () => {
    expect(stripSceneContextSuffix('Hello')).toBe('Hello');
  });
});

describe('truncateThreadTitle', () => {
  it('returns default for empty text', () => {
    expect(truncateThreadTitle('   ')).toBe(DEFAULT_THREAD_TITLE);
  });

  it('truncates long titles', () => {
    const title = truncateThreadTitle('a'.repeat(60), 48);
    expect(title.length).toBeLessThanOrEqual(48);
    expect(title.endsWith('…')).toBe(true);
  });
});

describe('mapHistoryMessagesToUi', () => {
  it('maps text parts and strips scene context', () => {
    const mapped = mapHistoryMessagesToUi([
      {
        id: 'm1',
        role: 'user',
        content: {
          parts: [
            {
              type: 'text',
              text: 'Hello\n\n---\nCurrent scene context:\n{}',
            },
          ],
        },
      },
      {
        id: 'm2',
        role: 'assistant',
        content: {
          parts: [{ type: 'text', text: 'Hi there' }],
        },
      },
      {
        id: 'm3',
        role: 'signal',
        content: { parts: [{ type: 'text', text: 'ignore' }] },
      },
    ]);

    expect(mapped).toEqual([
      {
        id: 'm1',
        role: 'user',
        parts: [{ type: 'text', text: 'Hello' }],
      },
      {
        id: 'm2',
        role: 'assistant',
        parts: [{ type: 'text', text: 'Hi there' }],
      },
    ]);
  });

  it('falls back to content.content string', () => {
    const mapped = mapHistoryMessagesToUi([
      {
        id: 'm1',
        role: 'user',
        content: {
          content: 'Plain text\n\n---\nCurrent scene context:\nx',
        },
      },
    ]);

    expect(mapped).toEqual([
      {
        id: 'm1',
        role: 'user',
        parts: [{ type: 'text', text: 'Plain text' }],
      },
    ]);
  });
});
