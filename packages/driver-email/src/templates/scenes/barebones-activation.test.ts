import { describe, expect, it } from 'vitest';

import { BlockRegistry } from '@openenvx/html';

import { builtinEmailBlocks } from '../../blocks/builtin-blocks';
import { createBarebonesActivationScene } from './barebones-activation';
import { renderEmailDocument } from '../../render/render-email-document';

describe('createBarebonesActivationScene', () => {
  it('uses email.row / email.column for the header (not email.columns)', () => {
    const scene = createBarebonesActivationScene();
    const root = scene.pages[0]!.layers[0]!;
    const json = JSON.stringify(root);
    expect(json).toContain('"type":"email.row"');
    expect(json).toContain('"type":"email.column"');
    expect(json).not.toContain('email.columns');
  });

  it('exports nested table markup for the header Row/Column tree', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const page = createBarebonesActivationScene().pages[0]!;
    const html = await renderEmailDocument(page, registry);

    expect(html).toContain('Barebones');
    expect(html).toContain("We're almost there!");
    expect(html).toContain('Confirm email');
    expect(html).toContain('data-id="__react-email-column"');
    expect(html).toMatch(/width:\s*50%/);
    expect(html).toMatch(/width="23"/);
    expect(html).toMatch(/vertical-align:\s*middle/);
    expect(html).toMatch(/border-radius:8px/i);
    expect(html).toMatch(/padding:16px 28px/i);
    expect(html).toMatch(/max-width:380px/i);
  });

  it('keeps footer slogan margin before social icons (no extra section padding)', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const html = await renderEmailDocument(
      createBarebonesActivationScene().pages[0]!,
      registry
    );
    const sloganAt = html.indexOf('catchy slogan');
    const slice = html.slice(sloganAt, sloganAt + 900);
    expect(slice).toMatch(/margin-bottom:\s*32px/i);
    // Social section must not reintroduce default 24px padding above icons.
    expect(slice).toMatch(/padding-top:\s*0/i);
    expect(slice).toMatch(/font-size:\s*0/i);
    expect(slice).toContain('placehold.co/36x36');
  });
});
