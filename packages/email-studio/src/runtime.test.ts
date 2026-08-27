import { describe, expect, it, vi } from 'vitest';

import { createEmailScene, renderEmailHtml } from './runtime';

vi.mock('@openenvx/driver-email/runtime', () => ({
  createEmailScene: () => ({
    schemaVersion: 1,
    pages: [{ id: 'email-page', layout: 'email', layers: [] }],
  }),
  renderEmailHtml: async () => '<html>Welcome</html>',
}));

describe('email runtime', () => {
  it('renders the starter scene without the editor shell', async () => {
    const html = await renderEmailHtml(createEmailScene());
    expect(html).toContain('Welcome');
  });
});
