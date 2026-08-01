import { describe, expect, it } from 'vitest';

import { mapWidgetTreeToHtmlLayers } from './map-widget-tree-to-html-layers';

describe(mapWidgetTreeToHtmlLayers, () => {
  it('maps Row/Column/Heading to html flex/heading layers', () => {
    const layers = mapWidgetTreeToHtmlLayers(
      {
        type: 'Row',
        props: { gap: 12 },
        children: [
          {
            type: 'Column',
            props: {},
            children: [
              {
                type: 'Heading',
                props: { level: 1, bind: 'title' },
                children: ['Hello'],
              },
            ],
          },
        ],
      },
      { idPrefix: 'w1' }
    );

    expect(layers).toHaveLength(1);
    const root = layers[0];
    expect(root?.type).toBe('html.flex');
    expect(root).toBeDefined();
    if (!root) {
      return;
    }
    const rowChildren = (root.data as { children: { type: string }[] })
      .children;
    const firstRow = rowChildren[0] as {
      type: string;
      data: {
        children: {
          type: string;
          writeMode?: string;
          data: { html: string; bind?: string };
        }[];
      };
    };
    expect(firstRow.type).toBe('html.flex');
    const heading = firstRow.data.children[0];
    expect(heading?.type).toBe('html.heading');
    expect(heading?.writeMode).toBe('free');
    expect(heading?.data.html).toBe('Hello');
    expect(heading?.data.bind).toBe('title');
  });

  it('drops Block escape hatches that smuggle nested children', () => {
    const layers = mapWidgetTreeToHtmlLayers(
      {
        type: 'Block',
        props: {
          type: 'html.flex',
          data: { children: [{ id: 'evil', type: 'html.text', data: {} }] },
        },
        children: [],
      },
      { idPrefix: 'w1' }
    );
    expect(layers).toEqual([]);
  });
});
