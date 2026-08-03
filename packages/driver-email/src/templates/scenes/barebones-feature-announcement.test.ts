import { describe, expect, it } from 'vitest';

import { BlockRegistry } from '@openenvx/html';

import { builtinEmailBlocks } from '../../blocks/builtin-blocks';
import { createBarebonesFeatureAnnouncementScene } from './barebones-feature-announcement';
import { renderEmailDocument } from '../../render/render-email-document';

describe('createBarebonesFeatureAnnouncementScene', () => {
  it('uses email.row / email.column for header and ways-to-work rows', () => {
    const scene = createBarebonesFeatureAnnouncementScene();
    const root = scene.pages[0]!.layers[0]!;
    const json = JSON.stringify(root);
    expect(json).toContain('"type":"email.row"');
    expect(json).toContain('"type":"email.column"');
    expect(json).not.toContain('email.columns');
  });

  it('exports release-notes markup with feature and CTA spacing', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const page = createBarebonesFeatureAnnouncementScene().pages[0]!;
    const html = await renderEmailDocument(page, registry);

    expect(html).toContain('Barebones');
    expect(html).toContain('Release Notes');
    expect(html).toContain('Try it out');
    expect(html).toContain('Go to Dashboard');
    expect(html).toContain('New ways to work');
    expect(html).toContain('Read more');
    expect(html).toMatch(/border-radius:\s*10px/i);
    expect(html).toMatch(/border-radius:\s*12px/i);
    expect(html).toMatch(/font-size:\s*40px/i);
    expect(html).toMatch(/padding:\s*16px 28px/i);
    expect(html).toMatch(/max-width:\s*420px/i);
  });
});
