import { describe, expect, it } from 'vitest';

import {
  AddCanvasGuideCommand,
  ClearCanvasGuidesCommand,
  MoveCanvasGuideCommand,
  RemoveCanvasGuideCommand,
} from './canvas-ruler-commands';

function createCtx(guides?: { id: string; orientation: 'horizontal' | 'vertical'; position: number }[]) {
  let pageGuides = guides;
  const applyCalls: unknown[] = [];
  return {
    applyCalls,
    ctx: {
      scene: {
        getActivePageId: () => 'page-1',
        getActivePage: () => ({
          id: 'page-1',
          guides: pageGuides,
        }),
        apply: (op: {
          apply: (scene: {
            pages: { id: string; guides?: typeof pageGuides }[];
          }) => {
            pages: { id: string; guides?: typeof pageGuides }[];
          };
        }) => {
          applyCalls.push(op);
          const next = op.apply({
            pages: [{ id: 'page-1', guides: pageGuides }],
          });
          pageGuides = next.pages[0]?.guides;
        },
      },
      services: {
        has: () => false,
        get: () => {
          throw new Error('unexpected');
        },
      },
    } as never,
  };
}

describe('canvas guide commands', () => {
  it('adds a guide via scene.apply', () => {
    const { applyCalls, ctx } = createCtx();
    new AddCanvasGuideCommand().execute(ctx, {
      orientation: 'vertical',
      position: 120,
      id: 'g1',
    });
    expect(applyCalls).toHaveLength(1);
    expect(ctx.scene.getActivePage().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 120 },
    ]);
  });

  it('moves and removes guides; clear empties the page', () => {
    const { ctx } = createCtx([
      { id: 'g1', orientation: 'vertical', position: 10 },
      { id: 'g2', orientation: 'horizontal', position: 20 },
    ]);

    new MoveCanvasGuideCommand().execute(ctx, { guideId: 'g1', position: 40 });
    expect(ctx.scene.getActivePage().guides?.[0]?.position).toBe(40);

    new RemoveCanvasGuideCommand().execute(ctx, { guideId: 'g2' });
    expect(ctx.scene.getActivePage().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 40 },
    ]);

    new ClearCanvasGuidesCommand().execute(ctx);
    expect(ctx.scene.getActivePage().guides).toBeUndefined();
  });
});
