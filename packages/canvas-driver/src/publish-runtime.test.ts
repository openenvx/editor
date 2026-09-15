import { describe, expect, it, vi } from 'vitest';

import { createCanvasScene } from './publish-runtime';

vi.mock('./plugin/canvas-plugin', () => ({
  createCanvasDemoScene: () => ({
    schemaVersion: 1,
    pages: [
      {
        id: 'canvas-page',
        name: 'Artboard',
        layout: 'absolute',
        layers: [],
      },
    ],
  }),
}));

describe('canvas publish runtime', () => {
  it('creates a starter scene without the editor shell', () => {
    const scene = createCanvasScene();
    expect(scene.schemaVersion).toBe(1);
    expect(scene.pages).toBeDefined();
    expect(Array.isArray(scene.pages)).toBe(true);
  });
});
