import { describe, expect, it } from 'vitest';

import {
  buildLayerSummary,
  formatSceneContext,
  isValidSceneContext,
} from './scene-summary';

const sampleContext = {
  activePageId: 'page-1',
  selection: {
    activePageId: 'page-1',
    selectedLayerIds: ['text-1'],
    primaryLayerId: 'text-1',
  },
  scene: {
    schemaVersion: 2,
    pages: [
      {
        id: 'page-1',
        name: 'Invite',
        layout: 'absolute' as const,
        width: 600,
        height: 800,
        layers: [
          {
            id: 'text-1',
            type: 'canvas.text',
            locked: false,
            transform: {
              x: 10,
              y: 20,
              width: 200,
              height: 40,
              rotation: 0,
              opacity: 1,
            },
            data: { name: 'Headline', html: '<p>Hi</p>' },
          },
          {
            id: 'rect-1',
            type: 'canvas.rect',
            transform: {
              x: 0,
              y: 0,
              width: 600,
              height: 800,
              rotation: 0,
              opacity: 1,
            },
            data: { fill: '#fff' },
          },
        ],
      },
    ],
  },
};

describe('formatSceneContext', () => {
  it('returns a compact summary without dumping full scene JSON', () => {
    const formatted = formatSceneContext(sampleContext);
    expect(formatted).toContain('Compact scene summary');
    expect(formatted).toContain('text-1');
    expect(formatted).toContain('list-layers');
    expect(formatted).not.toContain('"html": "<p>Hi</p>"');
  });

  it('builds layer summaries with bounds and names', () => {
    const layers = buildLayerSummary(sampleContext);
    expect(layers).toHaveLength(2);
    expect(layers[0]).toMatchObject({
      id: 'text-1',
      type: 'canvas.text',
      name: 'Headline',
      bounds: { x: 10, y: 20, width: 200, height: 40 },
    });
  });

  it('validates scene documents with isValidSceneContext', () => {
    expect(isValidSceneContext(sampleContext)).toBe(true);
    expect(
      isValidSceneContext({
        scene: { schemaVersion: 999, pages: [] },
      })
    ).toBe(false);
  });
});
