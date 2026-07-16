import { describe, expect, it } from 'vitest';

import { EditorService } from '../workbench/editor-service';
import { SceneStore } from '../scene/scene-store';
import { WorkbenchEventService } from '../runtime/workbench-events';
import { InstantiationService } from '../runtime/instantiation-service';
import type { CommandContext } from '../runtime/types';
import type { Layer, Page, Scene } from '../scene/types';
import {
  AddPageCommand,
  DuplicatePageCommand,
  RemovePageCommand,
  UndoCommand,
} from './scene-plugin';

function createPage(overrides: Partial<Page> = {}): Page {
  return {
    id: 'page-1',
    name: 'Page 1',
    layout: 'absolute',
    width: 1080,
    height: 1080,
    unit: 'px',
    dpi: 96,
    layers: [],
    ...overrides,
  };
}

function createContext(scene: Scene, activePageId?: string): CommandContext {
  const store = new SceneStore(scene);
  if (activePageId) {
    store.setActivePage(activePageId);
  }
  const services = new InstantiationService();
  const editor = new EditorService();
  editor.open(
    {
      uri: 'untitled',
      title: 'Untitled',
      scene: store.getScene(),
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
  return {
    id: 'group-1',
    type: 'canvas.group',
    data: {
      children: [{ id: 'child-1', type: 'canvas.rect', data: { fill: '#f00' } }],
    },
  };
}

describe('ScenePlugin page commands', () => {
  const addPage = new AddPageCommand();
  const removePage = new RemovePageCommand();
  const duplicatePage = new DuplicatePageCommand();
  const undo = new UndoCommand();

  it('addPage copies layout and size from the active page', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [createPage()],
    });
    addPage.execute(ctx);
    const pages = ctx.scene.getScene().pages;
    expect(pages).toHaveLength(2);
    expect(pages[1]).toMatchObject({
      name: 'Page 2',
      layout: 'absolute',
      width: 1080,
      height: 1080,
      unit: 'px',
      dpi: 96,
      layers: [],
    });
    expect(ctx.scene.getActivePageId()).toBe(pages[1]!.id);
  });

  it('removePage cannot execute on the last page', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [createPage()],
    });
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('removePage deletes the active page and activates a neighbor', () => {
    const ctx = createContext(
      {
        schemaVersion: 1,
        pages: [
          createPage({ id: 'a', name: 'A' }),
          createPage({ id: 'b', name: 'B' }),
          createPage({ id: 'c', name: 'C' }),
        ],
      },
      'b'
    );
    expect(removePage.canExecute(ctx)).toBe(true);
    removePage.execute(ctx);
    expect(ctx.scene.getScene().pages.map((p) => p.id)).toStrictEqual([
      'a',
      'c',
    ]);
    expect(ctx.scene.getActivePageId()).toBe('a');
  });

  it('duplicatePage clones layers with remapped nested ids', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [
        createPage({
          layers: [nestedGroupLayer()],
        }),
      ],
    });
    duplicatePage.execute(ctx);
    const pages = ctx.scene.getScene().pages;
    expect(pages).toHaveLength(2);
    expect(pages[1]!.name).toBe('Page 1 copy');
    expect(pages[1]!.layers[0]!.id).not.toBe('group-1');
    const children = (
      pages[1]!.layers[0]!.data as { children: Layer[] }
    ).children;
    expect(children[0]!.id).not.toBe('child-1');
    expect(ctx.scene.getActivePageId()).toBe(pages[1]!.id);
  });

  it('undo after addPage restores pages and active page', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [createPage({ id: 'page-1' })],
    });
    addPage.execute(ctx);
    expect(ctx.scene.getScene().pages).toHaveLength(2);
    undo.execute(ctx);
    expect(ctx.scene.getScene().pages).toHaveLength(1);
    expect(ctx.scene.getActivePageId()).toBe('page-1');
  });

  it('removePage cannot execute when template policy disallows delete', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [
        createPage({ id: 'a', name: 'A' }),
        createPage({ id: 'b', name: 'B' }),
      ],
      templatePolicy: { allowDeleteLayers: false },
    });
    expect(removePage.canExecute(ctx)).toBe(false);
  });

  it('duplicatePage cannot execute when template policy disallows insert', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [createPage()],
      templatePolicy: { allowInsertLayers: false },
    });
    expect(duplicatePage.canExecute(ctx)).toBe(false);
  });

  it('addPage activates the new page in a single notify', () => {
    const ctx = createContext({
      schemaVersion: 1,
      pages: [createPage({ id: 'page-1' })],
    });
    const activeIds: string[] = [];
    ctx.scene.subscribe((snap) => {
      activeIds.push(snap.editorState.activePageId);
    });
    activeIds.length = 0;
    addPage.execute(ctx);
    expect(activeIds).toHaveLength(1);
    expect(activeIds[0]).toBe(ctx.scene.getActivePageId());
    expect(ctx.scene.getScene().pages).toHaveLength(2);
  });
});
