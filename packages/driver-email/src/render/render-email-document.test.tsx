import { describe, expect, it } from 'vitest';

import { BlockRegistry } from '@openenvx/html';

import { builtinEmailBlocks } from '../blocks/builtin-blocks';
import { createEmailDemoScene } from '../create-email-demo-scene';
import { renderEmailDocument } from './render-email-document';

describe('renderEmailDocument', () => {
  it('renders table-based HTML for the demo email page', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const scene = createEmailDemoScene();
    const page = scene.pages[0]!;

    const html = await renderEmailDocument(page, registry);

    expect(html).toContain('<!DOCTYPE html');
    expect(html.toLowerCase()).toContain('<table');
    expect(html).toContain('Welcome');
    expect(html).toContain('Get started');
    expect(html).toContain('Thanks for signing up');
  });

  it('keeps page background on the outer shell, not the white content frame', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const scene = createEmailDemoScene();
    const page = scene.pages[0]!;
    const root = page.layers.find((layer) => layer.type === 'email.root')!;
    (root.data as { background: string }).background = '#abcdef';

    const html = await renderEmailDocument(page, registry);

    const pageBg = html.indexOf('background:#abcdef');
    const whiteFrame = html.indexOf('background:#ffffff');
    const welcome = html.indexOf('Welcome');
    expect(pageBg).toBeGreaterThan(-1);
    expect(whiteFrame).toBeGreaterThan(pageBg);
    expect(welcome).toBeGreaterThan(whiteFrame);
  });

  it('applies editable content padding on the white frame', async () => {
    const registry = new BlockRegistry();
    for (const block of builtinEmailBlocks) {
      registry.register(block);
    }
    const scene = createEmailDemoScene();
    const page = scene.pages[0]!;
    const root = page.layers.find((layer) => layer.type === 'email.root')!;
    (root.data as { padding: number }).padding = 48;

    const html = await renderEmailDocument(page, registry);

    expect(html).toMatch(/padding:48px/i);
  });
});
