import { describe, expect, it } from 'vitest';

import {
  buildLayerSummary,
  formatSceneContext,
} from './scene-summary';

const sampleContext = {
  activePageId: 'page-1',
  selection: {
    activePageId: 'page-1',
    selectedLayerIds: ['text-1'],
    primaryLayerId: 'text-1',
  },
  scene: {
    activePageId: 'page-1',
    pages: [
      {
        id: 'page-1',
        name: 'Invite',
        width: 600,
        height: 800,
        layers: [
          {
            id: 'text-1',
            type: 'text',
            locked: false,
            transform: { x: 10, y: 20, width: 200, height: 40 },
            data: { name: 'Headline', html: '<p>Hi</p>' },
          },
          {
            id: 'rect-1',
            type: 'rect',
            transform: { x: 0, y: 0, width: 600, height: 800 },
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
      type: 'text',
      name: 'Headline',
      bounds: { x: 10, y: 20, width: 200, height: 40 },
    });
  });
});
