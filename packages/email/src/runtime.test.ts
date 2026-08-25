import { describe, expect, it } from 'vitest';

import { createEmailScene, renderEmailHtml } from './runtime';

describe('email runtime', () => {
  it('renders the starter scene without the editor shell', async () => {
    const html = await renderEmailHtml(createEmailScene());
    expect(html).toContain('Welcome');
  });
});
