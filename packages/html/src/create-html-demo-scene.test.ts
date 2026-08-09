import { SCHEMA_VERSION } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import { createHtmlDemoScene } from './create-html-demo-scene';

describe('createHtmlDemoScene', () => {
  it('builds an html layout page with nested flex and grid', () => {
    const scene = createHtmlDemoScene();

    expect(scene.schemaVersion).toBe(SCHEMA_VERSION);
    expect(scene.pages).toHaveLength(1);

    const page = scene.pages[0]!;
    expect(page.layout).toBe('html');
    expect(page.id).toBe('html-page');

    const root = page.layers[0]!;
    expect(root.type).toBe('html.root');
    expect(root.id).toBe('root');

    const children = (root.data as { children: { id: string; type: string }[] })
      .children;
    expect(children.map((c) => c.id)).toEqual([
      'hero-1',
      'heading-1',
      'text-1',
      'flex-1',
      'grid-1',
    ]);
    expect(children[0]!.type).toBe('html.hero');

    const flex = children.find((c) => c.id === 'flex-1')!;
    expect(flex.type).toBe('html.flex');
    expect(
      (flex as { data: { children: unknown[] } }).data.children
    ).toHaveLength(2);

    const grid = children.find((c) => c.id === 'grid-1')!;
    expect(grid.type).toBe('html.grid');
    expect(
      (grid as { data: { children: unknown[] } }).data.children
    ).toHaveLength(2);
  });
});
