import { describe, expect, it } from 'vitest';

import {
  absoluteArtboard,
  documentWith,
  flowArtboard,
} from '../test/document-fixtures';
import { moveLayerToIndex, reorderLayers, SceneStore } from './scene-store';

describe(SceneStore, () => {
  it('records history for successful node prop updates', () => {
    const store = new SceneStore(
      documentWith([
        absoluteArtboard('p1', 'Page', 100, 100, [
          {
            frame: {
              height: 40,
              rotation: 0,
              width: 100,
              x: 0,
              y: 0,
            },
            id: 't1',
            opacity: 1,
            props: { align: 'left', html: '<p>Hi</p>' },
            scaleX: 1,
            scaleY: 1,
            type: 'canvas.text',
          },
        ]),
      ]),
      { activeArtboardId: 'p1', primaryNodeId: null, selectedNodeIds: [] }
    );

    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === 'p1'
            ? {
                ...artboard,
                nodes: artboard.nodes.map((node) =>
                  node.id === 't1'
                    ? {
                        ...node,
                        props: {
                          ...(node.props as object),
                          align: 'center',
                        },
                      }
                    : node
                ),
              }
            : artboard
        ),
      }),
      label: 'Update align',
    });

    expect(store.canUndo()).toBe(true);
    expect(
      (store.getDocument().artboards[0]!.nodes[0]!.props as { align?: string })
        .align
    ).toBe('center');
  });

  it('applies transactions with undo', () => {
    const store = new SceneStore();
    const pageId = store.getDocument().artboards[0]!.id;

    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === pageId
            ? {
                ...artboard,
                nodes: [
                  ...artboard.nodes,
                  { id: 'l1', props: { text: 'Hi' }, type: 'text' },
                ],
              }
            : artboard
        ),
      }),
      label: 'Add layer',
    });

    expect(store.getDocument().artboards[0]!.nodes).toHaveLength(1);
    expect(store.undo()).toBeTruthy();
    expect(store.getDocument().artboards[0]!.nodes).toHaveLength(0);
  });

  it('replaceScene pushes history so undo restores the prior scene', () => {
    const store = new SceneStore();
    const pageId = store.getDocument().artboards[0]!.id;
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === pageId
            ? {
                ...artboard,
                nodes: [{ id: 'keep', props: { text: 'A' }, type: 'text' }],
              }
            : artboard
        ),
      }),
      label: 'Seed',
    });

    store.replaceScene(
      documentWith([
        {
          extensions: { layout: 'email' },
          id: 'email-page',
          name: 'Template',
          nodes: [
            {
              id: 'root',
              props: { children: [] },
              type: 'email.root',
            },
          ],
          physical: { dpi: 96, unit: 'px' },
          space: {},
        },
      ])
    );

    expect(store.getDocument().artboards[0]!.name).toBe('Template');
    expect(store.canUndo()).toBe(true);
    expect(store.undo()).toBeTruthy();
    expect(
      store.getDocument().artboards[0]!.nodes.map((node) => node.id)
    ).toStrictEqual(['keep']);
  });

  it('setScene replaces without an extra history entry', () => {
    const store = new SceneStore();
    const beforeName = store.getDocument().artboards[0]!.name;
    store.setScene(documentWith([flowArtboard('p2', 'Replaced')]));
    expect(store.getDocument().artboards[0]!.name).toBe('Replaced');
    expect(store.canUndo()).toBe(false);
    expect(beforeName).not.toBe('Replaced');
  });

  it('commits scene.variables-only transactions', () => {
    const store = new SceneStore();
    expect(store.getDocument().variables).toBeUndefined();

    store.apply({
      apply: (document) => ({
        ...document,
        variables: [{ id: 'var-1', key: 'name' }],
      }),
      label: 'Add variable',
    });

    expect(store.getDocument().variables).toStrictEqual([
      { id: 'var-1', key: 'name' },
    ]);
    expect(store.canUndo()).toBe(true);
    expect(store.undo()).toBe(true);
    expect(store.getDocument().variables).toBeUndefined();
  });

  it('supports multi-select', () => {
    const store = new SceneStore();
    const pageId = store.getDocument().artboards[0]!.id;
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === pageId
            ? {
                ...artboard,
                nodes: [
                  { id: 'a', props: {}, type: 'text' },
                  { id: 'b', props: {}, type: 'text' },
                ],
              }
            : artboard
        ),
      }),
      label: 'Add layers',
    });
    store.selectNodes(['a', 'b'], 'a');
    expect(store.getSelection().selectedNodeIds).toStrictEqual(['a', 'b']);
    expect(store.getSelection().primaryNodeId).toBe('a');
  });

  it('keeps scene identity on selection-only changes', () => {
    const store = new SceneStore();
    const before = store.getDocument();
    let notifiedScene: unknown;
    store.onDidChangeScene((snapshot) => {
      notifiedScene = snapshot.document;
    });
    store.selectNodes([], null);
    expect(store.getDocument()).toBe(before);
    expect(notifiedScene).toBe(before);
  });

  it('shares page identity for untouched pages after apply', () => {
    const store = new SceneStore(
      documentWith([
        absoluteArtboard('p1', 'One', 100, 100, [
          {
            frame: {
              height: 10,
              rotation: 0,
              width: 10,
              x: 0,
              y: 0,
            },
            id: 'a',
            opacity: 1,
            props: { fill: '#000' },
            type: 'canvas.rect',
          },
        ]),
        absoluteArtboard('p2', 'Two', 100, 100),
      ])
    );
    const page2Before = store.getDocument().artboards[1];
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === 'p1'
            ? {
                ...artboard,
                nodes: artboard.nodes.map((node) =>
                  node.id === 'a'
                    ? {
                        ...node,
                        frame: {
                          ...node.frame!,
                          x: 5,
                        },
                      }
                    : node
                ),
              }
            : artboard
        ),
      }),
      label: 'Move a',
    });
    expect(store.getDocument().artboards[1]).toBe(page2Before);
  });

  it('commits page reorder when page refs are unchanged', () => {
    const store = new SceneStore(
      documentWith([
        absoluteArtboard('p1', 'One', 100, 100),
        absoluteArtboard('p2', 'Two', 100, 100),
      ])
    );
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: [document.artboards[1]!, document.artboards[0]!],
      }),
      label: 'Reorder pages',
    });
    expect(store.getDocument().artboards.map((artboard) => artboard.id)).toStrictEqual(
      ['p2', 'p1']
    );
  });

  it('prunes stale selection after apply removes layers', () => {
    const store = new SceneStore();
    const pageId = store.getDocument().artboards[0]!.id;
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === pageId
            ? {
                ...artboard,
                nodes: [
                  { id: 'a', props: {}, type: 'plugin.text' },
                  { id: 'b', props: {}, type: 'plugin.text' },
                ],
              }
            : artboard
        ),
      }),
      label: 'Add layers',
    });
    store.selectNodes(['a', 'b'], 'a');
    store.apply({
      apply: (document) => ({
        ...document,
        artboards: document.artboards.map((artboard) =>
          artboard.id === pageId
            ? {
                ...artboard,
                nodes: artboard.nodes.filter((node) => node.id !== 'a'),
              }
            : artboard
        ),
      }),
      label: 'Delete layer',
    });
    expect(store.getSelection().selectedNodeIds).toStrictEqual(['b']);
    expect(store.getSelection().primaryNodeId).toBe('b');
  });

  it('applies activeArtboardId atomically with the scene transaction', () => {
    const store = new SceneStore(
      documentWith([
        flowArtboard('a', 'A'),
        flowArtboard('b', 'B'),
        flowArtboard('c', 'C'),
      ])
    );
    store.setActiveArtboard('c');
    const snapshots: string[] = [];
    store.subscribe((snap) => {
      snapshots.push(snap.session.activeArtboardId);
    });
    snapshots.length = 0;
    store.apply({
      activeArtboardId: 'b',
      apply: (document) => ({
        ...document,
        artboards: document.artboards.filter((artboard) => artboard.id !== 'c'),
      }),
      label: 'Delete page',
    });
    expect(snapshots).toStrictEqual(['b']);
    expect(store.getActivePageId()).toBe('b');
    expect(store.getDocument().artboards.map((artboard) => artboard.id)).toStrictEqual(
      ['a', 'b']
    );
  });
});

describe(moveLayerToIndex, () => {
  const layers = [
    { id: 'a', props: {}, type: 'text' },
    { id: 'b', props: {}, type: 'text' },
    { id: 'c', props: {}, type: 'text' },
  ];

  it('moves layer to target index', () => {
    const result = moveLayerToIndex(layers, 'c', 0);
    expect(result.map((l) => l.id)).toStrictEqual(['c', 'a', 'b']);
  });

  it('returns same array when layer not found', () => {
    expect(moveLayerToIndex(layers, 'missing', 0)).toBe(layers);
  });

  it('clamps target index', () => {
    expect(moveLayerToIndex(layers, 'a', 99).map((l) => l.id)).toStrictEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('reorderLayers up/down delegates to moveLayerToIndex', () => {
    expect(reorderLayers(layers, 'b', 'up').map((l) => l.id)).toStrictEqual([
      'b',
      'a',
      'c',
    ]);
    expect(reorderLayers(layers, 'b', 'down').map((l) => l.id)).toStrictEqual([
      'a',
      'c',
      'b',
    ]);
  });
});

describe('SceneStore page rules', () => {
  it('rejects undimensioned absolute pages once page-rules lookup is wired', () => {
    const store = new SceneStore();
    store.setPageRulesLookup(() => ({}));
    expect(() =>
      store.setScene(
        documentWith([
          {
            extensions: { layout: 'absolute' },
            id: 'p1',
            name: 'Page',
            nodes: [],
            physical: { dpi: 96, unit: 'px' },
            space: {},
          },
        ])
      )
    ).toThrow(/space width and height/);
  });

  it('accepts undimensioned absolute pages when lookup is unset', () => {
    const store = new SceneStore();
    store.setScene(
      documentWith([
        {
          extensions: { layout: 'absolute' },
          id: 'p1',
          name: 'Page',
          nodes: [],
          physical: { dpi: 96, unit: 'px' },
          space: {},
        },
      ])
    );
    expect(store.getDocument().artboards[0]!.space?.width).toBeUndefined();
  });
});
