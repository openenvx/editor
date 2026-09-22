import {
  testArtboard,
  testDocument,
  testNode,
} from '../test/canvas-document-fixtures';

export function createRectExportScene() {
  return testDocument([
    testArtboard({
      background: '#ffffff',
      id: 'page-1',
      name: 'Page',
      nodes: [
        testNode({
          id: 'rect-1',
          props: { fill: '#ff0000' },
          type: 'canvas.rect',
          frame: {
            height: 100,
            rotation: 0,
            width: 150,
            x: 10,
            y: 20,
          },
        }),
      ],
      space: { height: 200, width: 300 },
    }),
  ]);
}
