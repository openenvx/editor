import { describe, expect, it, vi } from 'vitest';

import { createHtmlScene, renderBlockDocument } from './runtime';

vi.mock('@openenvx/html', () => ({
  createHtmlDemoScene: () => ({
    schemaVersion: 1,
    pages: [{ id: 'html-page', layout: 'html', layers: [] }],
  }),
}));

vi.mock('@openenvx/html/runtime', () => ({
  renderBlockDocument: async () => '<div>blocks</div>',
  BlockRegistry: class BlockRegistry {
    register() {}
  },
  builtinBlocks: [],
}));

describe('html runtime', () => {
  it('creates a starter scene without the editor shell', () => {
    const scene = createHtmlScene();
    expect(scene.pages[0]?.layout).toBe('html');
  });

  it('renders block documents without the editor shell', async () => {
    const html = await renderBlockDocument(createHtmlScene());
    expect(html).toContain('blocks');
  });
});
