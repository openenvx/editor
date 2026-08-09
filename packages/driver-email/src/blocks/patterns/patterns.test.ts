import { describe, expect, it } from 'vitest';

import { BlockRegistry, createBlock } from '@openenvx/html';
import type { Page } from '@openenvx/core/schema';

import { builtinEmailBlocks } from '../builtin-blocks';
import { renderEmailDocument } from '../../render/render-email-document';
import {
  articleWithImageBlock,
  emailPatternBlocks,
  emailPatternPartBlocks,
  headerBlock,
} from './index';

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

interface ChildLayer { type: string; data: Record<string, unknown> }

describe('email.header pattern', () => {
  it('defaultData children are logo + four nav links (Layers tree)', () => {
    const children = headerBlock.defaultData.children as ChildLayer[];
    expect(children.map((child) => child.type)).toEqual([
      'email.image',
      'email.link',
      'email.link',
      'email.link',
      'email.link',
    ]);
    expect(
      children.slice(1).map((child) => String(child.data.label))
    ).toEqual(['About', 'Blog', 'Company', 'Features']);
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

describe('email.articleWithImage pattern', () => {
  it('composes Elements as children visible in Layers', () => {
    const children = articleWithImageBlock.defaultData.children as ChildLayer[];
    expect(children.map((child) => child.type)).toEqual([
      'email.image',
      'email.text',
      'email.heading',
      'email.text',
      'email.button',
    ]);
    expect(articleWithImageBlock.acceptsChildren).toBe(true);
    expect(articleWithImageBlock.slots).toBeUndefined();
  });

  it('createBlock remints nested child ids', () => {
    const a = createBlock(
      'email.articleWithImage',
      'article-a',
      articleWithImageBlock.defaultData
    );
    const b = createBlock(
      'email.articleWithImage',
      'article-b',
      articleWithImageBlock.defaultData
    );
    const aKids = (a.data as { children: { id: string }[] }).children;
    const bKids = (b.data as { children: { id: string }[] }).children;
    expect(aKids).toHaveLength(5);
    expect(bKids).toHaveLength(5);
    expect(aKids.map((child) => child.id)).not.toEqual(
      bKids.map((child) => child.id)
    );
  });

  it('renders children in exported HTML', async () => {
    const registry = registryWithPatterns();
    const article = createBlock(
      'email.articleWithImage',
      'article-1',
      articleWithImageBlock.defaultData
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
            children: [article],
          },
        },
      ],
    };

    const html = await renderEmailDocument(page, registry);

    expect(html).toContain('herman-miller-chair.jpg');
    expect(html).toContain('Designing with Furniture');
    expect(html).toContain('Read more');
    expect(html).toContain('Our new article');
  });
});
