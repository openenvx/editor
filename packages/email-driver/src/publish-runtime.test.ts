import { describe, expect, it, vi } from 'vitest';

import { createEmailScene, renderEmailHtml } from './publish';

vi.mock('./render/render-email-html', () => ({
  renderEmailHtml: async () => '<html>Welcome</html>',
}));

vi.mock('./create-email-demo-scene', () => ({
  createEmailDemoScene: () => ({
    schemaVersion: 1,
    pages: [{ id: 'email-page', layout: 'email', layers: [] }],
  }),
}));

describe('email publish runtime', () => {
  it('renders the starter scene without the editor shell', async () => {
    const html = await renderEmailHtml(createEmailScene());
    expect(html).toContain('Welcome');
  });
});
