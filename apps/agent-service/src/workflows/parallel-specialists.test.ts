import { describe, expect, it } from 'vitest';

import { parallelSpecialistsOutputSchema } from './parallel-specialists';

describe('parallel-specialists output schema', () => {
  it('accepts merged specialist advice', () => {
    const parsed = parallelSpecialistsOutputSchema.parse({
      design: {
        agentId: 'design',
        summary: 'Invitation hierarchy',
        advice: 'Add couple names as hero text',
      },
      layout: {
        agentId: 'layout',
        summary: 'Center stack',
        advice: 'Align all text layers to center',
      },
      style: {
        agentId: 'style',
        summary: 'Soft palette',
        advice: 'Use ivory background and navy accents',
      },
      media: {
        agentId: 'media',
        summary: 'Stock photo',
        advice: 'Use Unsplash floral backdrop',
      },
      imageGen: {
        agentId: 'imageGen',
        summary: 'Skipped',
        advice: '',
      },
      combined: '## Design\n...',
    });
    expect(parsed.design.agentId).toBe('design');
    expect(parsed.layout.advice).toContain('Align');
    expect(parsed.media.agentId).toBe('media');
  });
});
