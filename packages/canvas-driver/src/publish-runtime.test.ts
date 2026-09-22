import { describe, expect, it, vi } from 'vitest';

import { createCanvasScene } from './publish-runtime';

vi.mock('./plugin/canvas-plugin', () => ({
  createCanvasDemoScene: () => ({
    artboards: [
      {
        id: 'canvas-page',
        name: 'Artboard',
        nodes: [],
        space: { height: 600, width: 800 },
      },
    ],
  }),
}));

describe('canvas publish runtime', () => {
  it('creates a starter scene without the editor shell', () => {
    const scene = createCanvasScene();
    expect(scene.artboards).toBeDefined();
    expect(Array.isArray(scene.artboards)).toBe(true);
  });
});
