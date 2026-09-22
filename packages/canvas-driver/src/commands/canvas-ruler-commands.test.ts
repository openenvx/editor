import { describe, expect, it } from 'vitest';

import {
  AddCanvasGuideCommand,
  ClearCanvasGuidesCommand,
  MoveCanvasGuideCommand,
  RemoveCanvasGuideCommand,
} from './canvas-ruler-commands';

function createCtx(
  guides?: {
    id: string;
    orientation: 'horizontal' | 'vertical';
    position: number;
  }[]
) {
  let pageGuides = guides;
  const applyCalls: unknown[] = [];
  const artboard = () => ({
    guides: pageGuides,
    id: 'page-1',
    nodes: [],
    space: { height: 600, width: 800 },
  });
  return {
    applyCalls,
    ctx: {
      scene: {
        apply: (op: {
          apply: (scene: {
            artboards: { id: string; guides?: typeof pageGuides }[];
          }) => {
            artboards: { id: string; guides?: typeof pageGuides }[];
          };
        }) => {
          applyCalls.push(op);
          const next = op.apply({
            artboards: [{ id: 'page-1', guides: pageGuides }],
          });
          pageGuides = next.artboards[0]?.guides;
        },
        getActiveArtboard: artboard,
        getActiveArtboardId: () => 'page-1',
        getActivePage: artboard,
      },
      services: {
        get: () => {
          throw new Error('unexpected');
        },
        has: () => false,
      },
    } as never,
  };
}

describe('canvas guide commands', () => {
  it('adds a guide via scene.apply', () => {
    const { applyCalls, ctx } = createCtx();
    new AddCanvasGuideCommand().execute(ctx, {
      id: 'g1',
      orientation: 'vertical',
      position: 120,
    });
    expect(applyCalls).toHaveLength(1);
    expect(ctx.scene.getActiveArtboard().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 120 },
    ]);
  });

  it('moves and removes guides; clear empties the page', () => {
    const { ctx } = createCtx([
      { id: 'g1', orientation: 'vertical', position: 10 },
      { id: 'g2', orientation: 'horizontal', position: 20 },
    ]);

    new MoveCanvasGuideCommand().execute(ctx, { guideId: 'g1', position: 40 });
    expect(ctx.scene.getActiveArtboard().guides?.[0]?.position).toBe(40);

    new RemoveCanvasGuideCommand().execute(ctx, { guideId: 'g2' });
    expect(ctx.scene.getActiveArtboard().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 40 },
    ]);

    new ClearCanvasGuidesCommand().execute(ctx);
    expect(ctx.scene.getActiveArtboard().guides).toBeUndefined();
  });
});
