import { describe, expect, it } from 'vitest';

import { EditorService } from '../workbench/editor-service';
import { SceneStore } from '../scene/scene-store';
import { WorkbenchEventService } from '../runtime/workbench-events';
import { InstantiationService } from '../runtime/instantiation-service';
import type { CommandContext } from '../runtime/types';
import {
  absoluteArtboard,
  asDocumentNode,
  documentWith,
} from '../test/document-fixtures';
import type { Artboard, Document, Layer } from '../scene/types';
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
    layers?: Layer[];
  } = {}
): Artboard {
  const { id, name, layers, ...rest } = {
    id: 'page-1',
    name: 'Artboard 1',
    layers: [] as Layer[],
    ...overrides,
  };
  return absoluteArtboard(id, name, 1080, 1080, layers, rest);
}

function createContext(scene: Document, activeArtboardId?: string): CommandContext {
  const store = new SceneStore(scene);
  if (activeArtboardId) {
    store.setActiveArtboard(activeArtboardId);
  }
  const services = new InstantiationService();
  const editor = new EditorService();
  editor.open(
    {
      uri: 'untitled',
      title: 'Untitled',
      scene: store.getDocument(),
      isDirty: false,
    },
    0
  );
  return {
    scene: store,
    selection: store.getSelection(),
    services,
    events: new WorkbenchEventService(),
    editor,
  };
}

function nestedGroupLayer(): Layer {
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
    const ctx = createContext(documentWith([createPage()]));
    addPage.execute(ctx);
    const pages = ctx.scene.getDocument().artboards;
    expect(pages).toHaveLength(2);
    expect(pages[1]).toMatchObject({
      name: 'Artboard 2',
      extensions: { layout: 'absolute' },
      space: { width: 1080, height: 1080 },
      physical: { unit: 'px', dpi: 96 },
      nodes: [],
    });
    expect(ctx.scene.getActivePageId()).toBe(pages[1]!.id);
  });

  it('removePage cannot execute on the last page', () => {
    const ctx = createContext(documentWith([createPage()]));
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('removePage deletes the active page and activates a neighbor', () => {
    const ctx = createContext(
      documentWith([
        createPage({ id: 'a', name: 'A' }),
        createPage({ id: 'b', name: 'B' }),
        createPage({ id: 'c', name: 'C' }),
      ]),
      'b'
    );
    expect(removePage.canExecute(ctx)).toBe(true);
    removePage.execute(ctx);
    expect(ctx.scene.getDocument().artboards.map((p) => p.id)).toStrictEqual([
      'a',
      'c',
    ]);
    expect(ctx.scene.getActivePageId()).toBe('a');
  });

  it('duplicatePage clones layers with remapped nested ids', () => {
    const ctx = createContext(
      documentWith([
        createPage({
          layers: [nestedGroupLayer()],
        }),
      ])
    );
    duplicatePage.execute(ctx);
    const pages = ctx.scene.getDocument().artboards;
    expect(pages).toHaveLength(2);
    expect(pages[1]!.name).toBe('Artboard 1 copy');
    expect(pages[1]!.nodes[0]!.id).not.toBe('group-1');
    const children = pages[1]!.nodes[0]!.children!;
    expect(children[0]!.id).not.toBe('child-1');
    expect(ctx.scene.getActivePageId()).toBe(pages[1]!.id);
  });

  it('undo after addPage restores pages and active page', () => {
    const ctx = createContext(documentWith([createPage({ id: 'page-1' })]));
    addPage.execute(ctx);
    expect(ctx.scene.getDocument().artboards).toHaveLength(2);
    undo.execute(ctx);
    expect(ctx.scene.getDocument().artboards).toHaveLength(1);
    expect(ctx.scene.getActivePageId()).toBe('page-1');
  });

  it('removePage cannot execute when template policy disallows delete', () => {
    const ctx = createContext(
      sceneDoc(
        [createPage({ id: 'a', name: 'A' }), createPage({ id: 'b', name: 'B' })],
        { templatePolicy: { allowDeleteLayers: false, version: 1 } }
      )
    );
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('duplicatePage cannot execute when template policy disallows insert', () => {
    const ctx = createContext(
      sceneDoc([createPage()], {
        templatePolicy: { allowInsertLayers: false, version: 1 },
      })
    );
    expect(duplicatePage.canExecute(ctx)).toBe(false);
  });

  it('addPage activates the new page in a single notify', () => {
    const ctx = createContext(documentWith([createPage({ id: 'page-1' })]));
    const activeIds: string[] = [];
    ctx.scene.subscribe((snap) => {
      activeIds.push(snap.session.activeArtboardId);
    });
    activeIds.length = 0;
    addPage.execute(ctx);
    expect(activeIds).toHaveLength(1);
    expect(activeIds[0]).toBe(ctx.scene.getActivePageId());
    expect(ctx.scene.getDocument().artboards).toHaveLength(2);
  });
});

describe('ScenePlugin rename commands', () => {
  const renamePage = new RenamePageCommand();
  const renameLayer = new RenameLayerCommand();
  const undo = new UndoCommand();

  it('renamePage updates the page name', () => {
    const ctx = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: 'Cover' });
    expect(ctx.scene.getDocument().artboards[0]?.name).toBe('Cover');
  });

  it('renamePage no-ops on blank or unchanged name', () => {
    const ctx = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: '   ' });
    expect(ctx.scene.getDocument().artboards[0]?.name).toBe('Page 1');
    renamePage.execute(ctx, { id: 'page-1', name: 'Page 1' });
    expect(ctx.scene.canUndo()).toBe(false);
  });

  it('renamePage is undoable', () => {
    const ctx = createContext(
      documentWith([createPage({ id: 'page-1', name: 'Page 1' })])
    );
    renamePage.execute(ctx, { id: 'page-1', name: 'Cover' });
    undo.execute(ctx);
    expect(ctx.scene.getDocument().artboards[0]?.name).toBe('Page 1');
  });

  it('renameLayer sets a custom name', () => {
    const ctx = createContext(
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
    expect(ctx.scene.getDocument().artboards[0]?.nodes[0]?.name).toBe('Hero');
  });

  it('renameLayer clears name when blank', () => {
    const ctx = createContext(
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
    expect(ctx.scene.getDocument().artboards[0]?.nodes[0]?.name).toBeUndefined();
  });

  it('renameLayer no-ops when name is unchanged', () => {
    const ctx = createContext(
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
    expect(ctx.scene.canUndo()).toBe(false);
  });
});
