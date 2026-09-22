import { SCHEMA_VERSION } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

import { createHtmlDemoScene } from './create-html-demo-scene';
import { artboardRulesLayout } from './test/document-fixtures';

describe('createHtmlDemoScene', () => {
  it('builds an html layout page with nested flex and grid', () => {
    const scene = createHtmlDemoScene();

    expect(scene.schemaVersion).toBe(SCHEMA_VERSION);
    expect(scene.artboards).toHaveLength(1);

    const page = scene.artboards[0]!;
    expect(artboardRulesLayout(page)).toBe('html');
    expect(page.id).toBe('html-page');

    const root = page.nodes[0]!;
    expect(root.type).toBe('html.root');
    expect(root.id).toBe('root');

    const children = root.children ?? [];
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
    expect(flex.children).toHaveLength(2);

    const grid = children.find((c) => c.id === 'grid-1')!;
    expect(grid.type).toBe('html.grid');
    expect(grid.children).toHaveLength(2);
  });
});
