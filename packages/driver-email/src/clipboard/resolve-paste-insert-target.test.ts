import { describe, expect, it } from 'vitest';

import { createEmailDemoScene } from '../create-email-demo-scene';
import { resolveEmailPasteInsertTarget } from './resolve-paste-insert-target';

function layersFromDemo() {
  return structuredClone(createEmailDemoScene().pages[0]!.layers);
}

describe('resolveEmailPasteInsertTarget', () => {
  it('wraps paste in a section under root when nothing is selected', () => {
    const layers = layersFromDemo();
    const target = resolveEmailPasteInsertTarget(layers, null);
    expect(target).toEqual({
      parentId: 'email-root',
      index: 1,
      wrapInSection: true,
    });
  });

  it('inserts after a text block inside a section', () => {
    const layers = layersFromDemo();
    const target = resolveEmailPasteInsertTarget(layers, 'text-1');
    expect(target).toEqual({
      parentId: 'section-1',
      index: 2,
      wrapInSection: false,
    });
  });

  it('inserts after a selected row in its parent section', () => {
    const layers = layersFromDemo();
    layers[0]!.data = {
      ...(layers[0]!.data as Record<string, unknown>),
      children: [
        {
          id: 'section-1',
          type: 'email.section',
          data: {
            children: [
              {
                id: 'row-1',
                type: 'email.row',
                data: {
                  children: [
                    {
                      id: 'col-1',
                      type: 'email.column',
                      data: { children: [] },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    const target = resolveEmailPasteInsertTarget(layers, 'row-1');
    expect(target).toEqual({
      parentId: 'section-1',
      index: 1,
      wrapInSection: false,
    });
  });

  it('appends inside a selected column', () => {
    const layers = layersFromDemo();
    layers[0]!.data = {
      ...(layers[0]!.data as Record<string, unknown>),
      children: [
        {
          id: 'section-1',
          type: 'email.section',
          data: {
            children: [
              {
                id: 'row-1',
                type: 'email.row',
                data: {
                  children: [
                    {
                      id: 'col-1',
                      type: 'email.column',
                      data: {
                        children: [
                          {
                            id: 'text-in-col',
                            type: 'email.text',
                            data: { html: 'Cell' },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    };

    const target = resolveEmailPasteInsertTarget(layers, 'col-1');
    expect(target).toEqual({
      parentId: 'col-1',
      index: 1,
      wrapInSection: false,
    });
  });

  it('inserts after a selected section', () => {
    const layers = layersFromDemo();
    const target = resolveEmailPasteInsertTarget(layers, 'section-1');
    expect(target).toEqual({
      parentId: 'email-root',
      index: 1,
      wrapInSection: false,
    });
  });

  it('inserts after a content block that is a direct child of root', () => {
    const layers = layersFromDemo();
    layers[0]!.data = {
      ...(layers[0]!.data as Record<string, unknown>),
      children: [
        {
          id: 'text-root',
          type: 'email.text',
          data: { html: 'Orphan text' },
        },
        {
          id: 'section-1',
          type: 'email.section',
          data: { children: [] },
        },
      ],
    };

    const target = resolveEmailPasteInsertTarget(layers, 'text-root');
    expect(target).toEqual({
      parentId: 'email-root',
      index: 1,
      wrapInSection: true,
    });
  });
});
