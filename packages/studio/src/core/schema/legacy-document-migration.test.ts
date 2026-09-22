import { describe, expect, it } from 'vitest';

import {
  normalizeDocument,
  normalizeEditorSession,
  normalizeProjectSnapshot,
} from './normalize';

describe('legacy document migration', () => {
  it('migrates pages/layers/transform/data into artboards/nodes/frame/props', () => {
    const document = normalizeDocument({
      pages: [
        {
          id: 'p1',
          layers: [
            {
              data: { fill: '#f00' },
              id: 'l1',
              transform: { height: 10, width: 20, x: 1, y: 2 },
              type: 'canvas.rect',
            },
          ],
        },
      ],
    });

    expect(document.artboards).toHaveLength(1);
    expect(document.artboards[0]!.id).toBe('p1');
    const node = document.artboards[0]!.nodes[0]!;
    expect(node.id).toBe('l1');
    expect(node.props?.fill).toBe('#f00');
    expect(node.frame).toMatchObject({ height: 10, width: 20, x: 1, y: 2 });
  });

  it('migrates legacy editor session keys', () => {
    const session = normalizeEditorSession(
      {
        activePageId: 'p1',
        primaryLayerId: 'l1',
        selectedLayerIds: ['l1'],
      },
      'fallback'
    );
    expect(session.activeArtboardId).toBe('p1');
    expect(session.selectedNodeIds).toEqual(['l1']);
    expect(session.primaryNodeId).toBe('l1');
  });

  it('migrates legacy project snapshot with scene.pages', () => {
    const snapshot = normalizeProjectSnapshot({
      editorState: {
        activePageId: 'p1',
        primaryLayerId: 'l1',
        selectedLayerIds: ['l1'],
      },
      scene: {
        pages: [
          {
            id: 'p1',
            layers: [
              {
                data: { fill: '#00f' },
                id: 'l1',
                type: 'canvas.rect',
              },
            ],
          },
        ],
      },
    });

    expect(snapshot.document.artboards[0]!.nodes).toHaveLength(1);
    expect(snapshot.session.activeArtboardId).toBe('p1');
    expect(snapshot.session.selectedNodeIds).toEqual(['l1']);
  });

  it('migrates template policy field renames', () => {
    const document = normalizeDocument({
      artboards: [{ extensions: { layout: 'flow' }, id: 'p1', nodes: [] }],
      templatePolicy: {
        allowDeleteLayers: true,
        allowDuplicateLayers: true,
        allowInsertLayers: true,
        allowPageResize: false,
        frozenLayers: {
          l1: { data: { fill: '#000' }, transform: { x: 0, y: 0 } },
        },
        version: 1,
      },
    });

    expect(document.templatePolicy?.allowArtboardResize).toBe(false);
    expect(document.templatePolicy?.frozenNodes?.l1?.props).toEqual({
      fill: '#000',
    });
    expect(document.templatePolicy?.frozenNodes?.l1?.frame).toMatchObject({
      x: 0,
      y: 0,
    });
  });
});
