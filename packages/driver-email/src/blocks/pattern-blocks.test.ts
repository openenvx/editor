import { describe, expect, it } from 'vitest';

import { BlockRegistry, createBlock } from '@openenvx/html';
import type { Page } from '@openenvx/schema';

import { builtinEmailBlocks } from './builtin-blocks';
import {
  emailPatternBlocks,
  emailPatternPartBlocks,
  headerBlock,
} from './pattern-blocks';
import { renderEmailDocument } from '../render/render-email-document';

function registryWithPatterns(): BlockRegistry {
  const registry = new BlockRegistry();
  for (const block of [
    ...builtinEmailBlocks,
    ...emailPatternPartBlocks,
    ...emailPatternBlocks,
  ]) {
    registry.register(block);
  }
  return registry;
}

describe('email.header pattern', () => {
  it('defaultData includes logo and four nav links', () => {
    const slots = headerBlock.defaultData.slots as {
      logo: { type: string }[];
      links: { data: { label: string } }[];
    };
    expect(slots.logo).toHaveLength(1);
    expect(slots.logo[0]?.type).toBe('email.image');
    expect(slots.links.map((link) => link.data.label)).toEqual([
      'About',
      'Blog',
      'Company',
      'Features',
    ]);
  });

  it('renders logo and nav links in exported HTML', async () => {
    const registry = registryWithPatterns();
    const header = createBlock(
      'email.header',
      'header-1',
      headerBlock.defaultData
    );
    const page: Page = {
      id: 'page-1',
      name: 'Email',
      layout: 'email',
      width: 600,
      height: 800,
      layers: [
        {
          id: 'root-1',
          type: 'email.root',
          data: {
            background: '#f6f9fc',
            preheader: '',
            children: [header],
          },
        },
      ],
    };

    const html = await renderEmailDocument(page, registry);

    expect(html).toContain('react.email/static/logo-without-background.png');
    expect(html).toContain('About');
    expect(html).toContain('Blog');
    expect(html).toContain('Company');
    expect(html).toContain('Features');
  });
});
