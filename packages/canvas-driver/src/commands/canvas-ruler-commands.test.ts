import { DocumentStore,requireDocumentStore } from '@openenvx/editor';
import { describe, expect, it } from 'vitest';

import { testArtboard, testDocument } from '../test/canvas-document-fixtures';
import { createCanvasCommandContextFromStore } from '../test/mock-command-context';
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
  const artboard = {
    ...testArtboard({ id: 'page-1', nodes: [] }),
    ...(guides ? { guides } : {}),
  };
  const store = new DocumentStore(testDocument([artboard]));
  return { ctx: createCanvasCommandContextFromStore(store), store };
}

describe('canvas guide commands', () => {
  it('adds a guide via scene.apply', () => {
    const { ctx } = createCtx();
    new AddCanvasGuideCommand().execute(ctx, {
      id: 'g1',
      orientation: 'vertical',
      position: 120,
    });
    expect(requireDocumentStore(ctx).getActiveArtboard().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 120 },
    ]);
  });

  it('moves and removes guides; clear empties the page', () => {
    const { ctx } = createCtx([
      { id: 'g1', orientation: 'vertical', position: 10 },
      { id: 'g2', orientation: 'horizontal', position: 20 },
    ]);

    new MoveCanvasGuideCommand().execute(ctx, { guideId: 'g1', position: 40 });
    expect(
      requireDocumentStore(ctx).getActiveArtboard().guides?.[0]?.position
    ).toBe(40);

    new RemoveCanvasGuideCommand().execute(ctx, { guideId: 'g2' });
    expect(requireDocumentStore(ctx).getActiveArtboard().guides).toEqual([
      { id: 'g1', orientation: 'vertical', position: 40 },
    ]);

    new ClearCanvasGuidesCommand().execute(ctx);
    expect(requireDocumentStore(ctx).getActiveArtboard().guides).toBeUndefined();
  });
});