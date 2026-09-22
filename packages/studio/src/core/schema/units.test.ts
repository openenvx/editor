import { normalizeScene } from '@openenvx/studio/schema';
import { describe, expect, it } from 'vitest';

describe('schema units', () => {
  it('normalizes artboard unit and dpi', () => {
    const scene = normalizeScene({
      artboards: [
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Print',
          nodes: [],
          physical: { unit: 'mm' },
          space: { height: 297, width: 210 },
        },
      ],
    });
    expect(scene.artboards[0]?.physical?.unit).toBe('mm');
    expect(scene.artboards[0]?.physical?.dpi).toBe(96);
  });

  it('normalizes nested container children', () => {
    const scene = normalizeScene({
      artboards: [
        {
          extensions: { layout: 'flow' },
          id: 'p1',
          name: 'Flow',
          nodes: [
            {
              children: [
                {
                  id: 'h1',
                  props: { level: 2, text: 'Hi' },
                  type: 'heading',
                },
              ],
              id: 'c1',
              props: { layout: 'row' },
              type: 'container',
            },
          ],
          space: {},
        },
      ],
    });
    const container = scene.artboards[0]!.nodes[0]!;
    expect(container.children?.[0]?.id).toBe('h1');
  });
});
