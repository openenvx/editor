import { describe, expect, it } from 'vitest';

import { createMockCommandContext } from '../test/mock-command-context';
import {
  absoluteArtboard,
  asDocumentNode,
  documentWith,
} from '../test/document-fixtures';
import type { Artboard, Document, DocumentNode } from '../scene/types';
import {
  AddPageCommand,
  DuplicatePageCommand,
  RemovePageCommand,
  RenameLayerCommand,
  RenamePageCommand,
  UndoCommand,
} from './scene-plugin';

function createPage(
  overrides: {
    id?: string;
    name?: string;
    layers?: DocumentNode[];
  } = {}
): Artboard {
  const { id, name, layers, ...rest } = {
    id: 'page-1',
    name: 'Artboard 1',
    layers: [] as DocumentNode[],
    ...overrides,
  };
  return absoluteArtboard(id, name, 1080, 1080, layers, rest);
}

function createContext(scene: Document, activeArtboardId?: string) {
  return createMockCommandContext(scene, {
    activeArtboardId,
  });
}

function nestedGroupLayer(): DocumentNode {
  return asDocumentNode({
    id: 'group-1',
    type: 'canvas.group',
    children: [{ id: 'child-1', type: 'canvas.rect', data: { fill: '#f00' } }],
  });
}

function sceneDoc(
  pages: Artboard[],
  extras?: Omit<Document, 'artboards'>
): Document {
  return { ...extras, artboards: pages };
}

describe('ScenePlugin page commands', () => {
  const addPage = new AddPageCommand();
  const removePage = new RemovePageCommand();
  const duplicatePage = new DuplicatePageCommand();
  const undo = new UndoCommand();

  it('addPage copies layout and size from the active page', () => {
    const { ctx, store } = createContext(documentWith([createPage()]));
    addPage.execute(ctx);
    const pages = store.getDocument().artboards;
    expect(pages).toHaveLength(2);
    expect(pages[1]).toMatchObject({
      name: 'Artboard 2',
      extensions: { layout: 'absolute' },
      space: { width: 1080, height: 1080 },
      physical: { unit: 'px', dpi: 96 },
      nodes: [],
    });
    expect(store.getActiveArtboardId()).toBe(pages[1]!.id);
  });

  it('removePage cannot execute on the last page', () => {
    const { ctx } = createContext(documentWith([createPage()]));
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('removePage deletes the active page and activates a neighbor', () => {
    const { ctx, store } = createContext(
      documentWith([
        createPage({ id: 'a', name: 'A' }),
        createPage({ id: 'b', name: 'B' }),
        createPage({ id: 'c', name: 'C' }),
      ]),
      'b'
    );
    expect(removePage.canExecute(ctx)).toBe(true);
    removePage.execute(ctx);
    expect(store.getDocument().artboards.map((p) => p.id)).toStrictEqual([
      'a',
      'c',
    ]);
    expect(store.getActiveArtboardId()).toBe('a');
  });

  it('duplicatePage clones layers with remapped nested ids', () => {
    const { ctx, store } = createContext(
      documentWith([
        createPage({
          layers: [nestedGroupLayer()],
        }),
      ])
    );
    duplicatePage.execute(ctx);
    const pages = store.getDocument().artboards;
    expect(pages).toHaveLength(2);
    expect(pages[1]!.name).toBe('Artboard 1 copy');
    expect(pages[1]!.nodes[0]!.id).not.toBe('group-1');
    const children = pages[1]!.nodes[0]!.children!;
    expect(children[0]!.id).not.toBe('child-1');
    expect(store.getActiveArtboardId()).toBe(pages[1]!.id);
  });

  it('undo after addPage restores pages and active page', () => {
    const { ctx, store } = createContext(documentWith([createPage({ id: 'page-1' })]));
    addPage.execute(ctx);
    expect(store.getDocument().artboards).toHaveLength(2);
    undo.execute(ctx);
    expect(store.getDocument().artboards).toHaveLength(1);
    expect(store.getActiveArtboardId()).toBe('page-1');
  });

  it('removePage cannot execute when template policy disallows delete', () => {
    const { ctx } = createContext(
      sceneDoc(
        [createPage({ id: 'a', name: 'A' }), createPage({ id: 'b', name: 'B' })],
        { templatePolicy: { allowDeleteLayers: false, version: 1 } }
      )
    );
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('duplicatePage cannot execute when template policy disallows insert', () => {
    const { ctx } = createContext(
      sceneDoc([createPage()], {
        templatePolicy: { allowInsertLayers: false, version: 1 },
      })
    );
    expect(duplicatePage.canExecute(ctx)).toBe(false);
  });

  it('addPage activates the new page in a single notify', () => {
    const { ctx, store } = createContext(documentWith([createPage({ id: 'page-1' })]));
    const activeIds: string[] = [];
    store.subscribe((snap) => {
      activeIds.push(snap.session.activeArtboardId);
    });
    activeIds.length = 0;
    addPage.execute(ctx);
    expect(activeIds).toHaveLength(1);
    expect(activeIds[0]).toBe(store.getActiveArtboardId());
    expect(store.getDocument().artboards).toHaveLength(2);
  });
});

describe('ScenePlugin rename commands', () => {
  const renamePage = new RenamePageCommand();
  const renameLayer = new RenameLayerCommand();
  const undo = new UndoCommand();

  it('renamePage updates the page name', () => {
    const { ctx, store } = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: 'Cover' });
    expect(store.getDocument().artboards[0]?.name).toBe('Cover');
  });

  it('renamePage no-ops on blank or unchanged name', () => {
    const { ctx, store } = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: '   ' });
    expect(store.getDocument().artboards[0]?.name).toBe('Page 1');
    renamePage.execute(ctx, { id: 'page-1', name: 'Page 1' });
    expect(store.canUndo()).toBe(false);
  });

  it('renamePage is undoable', () => {
    const { ctx, store } = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: 'Cover' });
    undo.execute(ctx);
    expect(store.getDocument().artboards[0]?.name).toBe('Page 1');
  });

  it('renameLayer sets a custom name', () => {
    const { ctx, store } = createContext(
      documentWith([
        createPage({
          layers: [
            asDocumentNode({
              id: 'rect-1',
              type: 'canvas.rect',
              data: { fill: '#f00' },
            }),
          ],
        }),
      ])
    );
    renameLayer.execute(ctx, { id: 'rect-1', name: 'Hero' });
    expect(store.getDocument().artboards[0]?.nodes[0]?.name).toBe('Hero');
  });

  it('renameLayer clears name when blank', () => {
    const { ctx, store } = createContext(
      documentWith([
        createPage({
          layers: [
            asDocumentNode({
              id: 'rect-1',
              type: 'canvas.rect',
              name: 'Hero',
              data: { fill: '#f00' },
            }),
          ],
        }),
      ])
    );
    renameLayer.execute(ctx, { id: 'rect-1', name: '  ' });
    expect(store.getDocument().artboards[0]?.nodes[0]?.name).toBeUndefined();
  });

  it('renameLayer no-ops when name is unchanged', () => {
    const { ctx, store } = createContext(
      documentWith([
        createPage({
          layers: [
            asDocumentNode({
              id: 'rect-1',
              type: 'canvas.rect',
              name: 'Hero',
              data: { fill: '#f00' },
            }),
          ],
        }),
      ])
    );
    renameLayer.execute(ctx, { id: 'rect-1', name: 'Hero' });
    expect(store.canUndo()).toBe(false);
  });
});
