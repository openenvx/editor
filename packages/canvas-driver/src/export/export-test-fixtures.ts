import { normalizeScene } from '@openenvx/studio/schema';

export function createRectExportScene() {
  return normalizeScene({
    activePageId: 'page-1',
    pages: [
      {
        backgroundColor: '#ffffff',
        height: 200,
        id: 'page-1',
        layout: 'absolute',
        layers: [
          {
            data: { fill: '#ff0000' },
            id: 'rect-1',
            transform: {
              height: 100,
              opacity: 1,
              rotation: 0,
              width: 150,
              x: 10,
              y: 20,
            },
            type: 'canvas.rect',
          },
        ],
        name: 'Page',
        width: 300,
      },
    ],
  });
}
