import { describe, expect, it } from 'vitest';

import {
  DEFAULT_THREAD_TITLE,
  truncateThreadTitle,
} from '../client/agent-service-client';

describe('truncateThreadTitle', () => {
  it('returns default for blank input', () => {
    expect(truncateThreadTitle('')).toBe(DEFAULT_THREAD_TITLE);
  });

  it('keeps short titles intact', () => {
    expect(truncateThreadTitle('Align the logo')).toBe('Align the logo');
  });

  it('truncates long titles with an ellipsis', () => {
    const title = truncateThreadTitle('x'.repeat(80), 40);
    expect(title.length).toBeLessThanOrEqual(40);
    expect(title.endsWith('…')).toBe(true);
  });
});
