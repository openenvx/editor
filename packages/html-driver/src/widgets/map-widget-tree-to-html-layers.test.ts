import { describe, expect, it } from 'vitest';

import { blockProps } from '../test/document-fixtures';
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
    const rowChildren = root.children ?? [];
    const firstRow = rowChildren[0]!;
    expect(firstRow.type).toBe('html.flex');
    const heading = firstRow.children?.[0];
    expect(heading?.type).toBe('html.heading');
    expect(heading?.writeMode).toBe('content');
    expect(blockProps(heading!).html).toBe('Hello');
    expect(blockProps(heading!).bind).toBe('title');
  });

  it('records onClick handler ids on mapped face layers', () => {
    const handlers: Record<string, Record<string, string>> = {};
    mapWidgetTreeToHtmlLayers(
      {
        type: 'Button',
        props: { onClick: 'h1' },
        children: ['Add'],
      },
      { idPrefix: 'w1', handlersOut: handlers }
    );
    const layerId = Object.keys(handlers)[0];
    expect(layerId).toBeDefined();
    expect(handlers[layerId]?.click).toBe('h1');
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
