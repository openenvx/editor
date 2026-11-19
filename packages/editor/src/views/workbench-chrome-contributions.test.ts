import { moveNodeRelativeToTarget, requireDocumentStore } from '@openenvx/editor';
import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  WorkbenchPlugin,
  type TreeItem,
  type WorkbenchPluginContext,
  type CommandContext,
  type DocumentNode,
} from '@openenvx/studio';
import { createDefaultFrame } from '@openenvx/editor/schema';
import { describe, expect, it } from 'vitest';

import {
  asDocumentNode,
  documentWith,
  flowArtboard,
  normalizeProjectSnapshotForTest,
} from '../test/document-fixtures';
import { createMockCommandContext } from '../test/mock-command-context';
import { createWorkbenchWithEditor } from '../test/create-workbench-with-editor';

import { setTemplatePolicyEnforced } from '../scene/layer-editability';

import {
  LayersTreeProvider,
  PagesTreeProvider,
  WORKBENCH_PAGES_VIEW_ID,
} from './workbench-chrome-contributions';

class TestLayersTreeProvider extends TreeDataProvider<DocumentNode> {
  getRootChildren(ctx: CommandContext): DocumentNode[] {
    return requireDocumentStore(ctx).getActiveArtboard().nodes;
  }

  getChildren(): DocumentNode[] {
    return [];
  }

  getTreeItem(node: DocumentNode): TreeItem {
    return { id: node.id, label: node.type };
  }

  handleMove(
    source: DocumentNode,
    target: DocumentNode,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const store = requireDocumentStore(ctx);
    const page = store.getActiveArtboard();
    const effectivePosition = position === 'inside' ? 'after' : position;
    store.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((p) =>
          p.id === page.id
            ? {
                ...p,
                nodes: moveNodeRelativeToTarget(
                  p.nodes,
                  source.id,
                  target.id,
                  effectivePosition
                ),
              }
            : p
        ),
      }),
      label: 'Reorder layer',
    });
  }
}

class LayersView extends ViewContribution {
  readonly id = 'layers.tree';
  readonly containerId = 'layers';
  readonly name = 'Layers';
}

class LayersViewContainer extends ViewContainerContribution {
  readonly id = 'layers';
  readonly title = 'Layers';
}

class LayersPlugin extends WorkbenchPlugin {
  readonly id = 'test.nodes';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new LayersViewContainer(), new LayersView());
    ctx.registerTreeDataProvider('layers.tree', new TestLayersTreeProvider());
  }
}

class PagesView extends ViewContribution {
  readonly id = WORKBENCH_PAGES_VIEW_ID;
  readonly containerId = 'pages';
  readonly name = 'Pages';
}

class PagesViewContainer extends ViewContainerContribution {
  readonly id = 'pages';
  readonly title = 'Pages';
}

class PagesPlugin extends WorkbenchPlugin {
  readonly id = 'test.artboards';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new PagesViewContainer(), new PagesView());
    ctx.registerTreeDataProvider(
      WORKBENCH_PAGES_VIEW_ID,
      new PagesTreeProvider()
    );
  }
}

describe('moveViewItem', () => {
  it('delegates to tree provider handleMove', async () => {
    const controller = createWorkbenchWithEditor(
      normalizeProjectSnapshotForTest({
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'absolute',
            width: 800,
            height: 600,
            layers: [
              {
                id: 'x',
                type: 'canvas.rect',
                data: { fill: '#000000' },
                transform: createDefaultFrame(),
              },
              {
                id: 'y',
                type: 'canvas.rect',
                data: { fill: '#ffffff' },
                transform: createDefaultFrame(),
              },
            ],
          },
        ],
        activeArtboardId: 'p1',
      }),
      [new LayersPlugin()]
    );
    await controller.start();
    controller.moveViewItem(
      'layers.tree',
      {
        id: 'y',
        type: 'canvas.rect',
        data: { fill: '#ffffff' },
        transform: createDefaultFrame(),
      },
      {
        id: 'x',
        type: 'canvas.rect',
        data: { fill: '#000000' },
        transform: createDefaultFrame(),
      },
      'before'
    );
    expect(
      controller.getState().scene.artboards[0]!.nodes.map((l) => l.id)
    ).toStrictEqual(['y', 'x']);
  });
});

describe('PagesTreeProvider', () => {
  it('selects a page via setActivePage', async () => {
    const controller = createWorkbenchWithEditor(
      normalizeProjectSnapshotForTest({
        pages: [
          { id: 'a', name: 'A', layout: 'flow', layers: [] },
          { id: 'b', name: 'B', layout: 'flow', layers: [] },
        ],
        activeArtboardId: 'a',
      }),
      [new PagesPlugin()]
    );
    await controller.start();
    controller.selectViewItem(WORKBENCH_PAGES_VIEW_ID, {
      id: 'b',
      name: 'B',
      layout: 'flow',
      layers: [],
    });
    expect(controller.getState().selection.activeArtboardId).toBe('b');
    expect(controller.getState().scene.artboards).toHaveLength(2);
  });

  it('reorders pages via handleMove', async () => {
    const controller = createWorkbenchWithEditor(
      normalizeProjectSnapshotForTest({
        pages: [
          { id: 'a', name: 'A', layout: 'flow', layers: [] },
          { id: 'b', name: 'B', layout: 'flow', layers: [] },
          { id: 'c', name: 'C', layout: 'flow', layers: [] },
        ],
        activeArtboardId: 'a',
      }),
      [new PagesPlugin()]
    );
    await controller.start();
    controller.moveViewItem(
      WORKBENCH_PAGES_VIEW_ID,
      flowArtboard('c', 'C'),
      flowArtboard('a', 'A'),
      'before'
    );
    expect(controller.getState().scene.artboards.map((p) => p.id)).toStrictEqual([
      'c',
      'a',
      'b',
    ]);
    expect(controller.getState().selection.activeArtboardId).toBe('a');
  });

  it('canMove rejects inside drops', () => {
    const provider = new PagesTreeProvider();
    const a = flowArtboard('a', 'A');
    const b = flowArtboard('b', 'B');
    expect(provider.canMove?.(a, b, 'before')).toBe(true);
    expect(provider.canMove?.(a, b, 'inside')).toBe(false);
  });

  it('exposes rename command and edit label', () => {
    const provider = new PagesTreeProvider();
    const item = provider.getTreeItem(
      flowArtboard('a', 'Cover'),
      {} as CommandContext
    );
    expect(item).toMatchObject({
      editLabel: 'Cover',
      label: 'Cover',
      renameCommandId: 'scene.renamePage',
    });
  });
});

describe('LayersTreeProvider', () => {
  it('walks node children for nested layers', () => {
    const provider = new LayersTreeProvider();
    const child = asDocumentNode({
      id: 'child',
      type: 'html.text',
      data: { text: 'Hi' },
    });
    const parent = asDocumentNode({
      id: 'parent',
      type: 'html.flex',
      children: [child],
    });
    expect(provider.getChildren(parent)).toEqual([child]);
    expect(provider.getChildren(child)).toEqual([]);
  });

  it('rejects moves that would place a layer beside or above the layout root', () => {
    const provider = new LayersTreeProvider();
    const root = asDocumentNode({
      id: 'root',
      type: 'email.root',
      children: [],
    });
    const block = asDocumentNode({
      id: 'section-1',
      type: 'email.section',
      children: [],
    });

    expect(provider.canMove?.(block, root, 'before')).toBe(false);
    expect(provider.canMove?.(block, root, 'after')).toBe(false);
    expect(provider.canMove?.(block, root, 'inside')).toBe(true);
    expect(provider.canMove?.(root, block, 'after')).toBe(false);
  });

  it('marks empty containers collapsible and accepts nest-into drops', () => {
    const provider = new LayersTreeProvider();
    const section = asDocumentNode({
      id: 'section',
      type: 'email.section',
      children: [],
    });
    const text = asDocumentNode({
      id: 'text',
      type: 'email.text',
      data: { text: 'Hi' },
    });
    const item = provider.getTreeItem(section, {
      services: { has: () => false },
    } as unknown as CommandContext);

    expect(item.collapsible).toBe(true);
    expect(
      provider.getTreeItem(text, {
        services: { has: () => false },
      } as unknown as CommandContext).collapsible
    ).toBe(false);
    expect(provider.canMove?.(text, section, 'inside')).toBe(true);
    expect(
      provider.canMove?.(
        text,
        { id: 'other', type: 'email.text', data: { text: 'x' } },
        'inside'
      )
    ).toBe(false);
  });

  it('nests into an empty section on inside drops', () => {
    const provider = new LayersTreeProvider();
    const section = asDocumentNode({
      id: 'section',
      type: 'email.section',
      children: [],
    });
    const text = asDocumentNode({
      id: 'text',
      type: 'email.text',
      data: { text: 'Hi' },
    });
    const root = asDocumentNode({
      id: 'root',
      type: 'email.root',
      children: [section, text],
    });
    const { ctx, store } = createMockCommandContext(
      documentWith([flowArtboard('p1', 'p1', [root])])
    );

    provider.handleMove?.(text, section, 'inside', ctx);

    const pageLayers = store.getActiveArtboard().nodes;
    const nextRoot = pageLayers[0]!;
    const nextSection = nextRoot.children![0]!;
    expect(nextRoot.children!.map((l) => l.id)).toEqual(['section']);
    expect(nextSection.children!.map((l) => l.id)).toEqual(['text']);
  });

  it('nests into the layout root on inside drops instead of hoisting beside it', () => {
    const provider = new LayersTreeProvider();
    const root = asDocumentNode({
      id: 'root',
      type: 'email.root',
      children: [
        asDocumentNode({ id: 'a', type: 'email.section', children: [] }),
        asDocumentNode({ id: 'b', type: 'email.section', children: [] }),
      ],
    });
    const { ctx, store } = createMockCommandContext(
      documentWith([flowArtboard('p1', 'p1', [root])])
    );

    const b = root.children![1]!;
    provider.handleMove?.(b, root, 'inside', ctx);

    const pageLayers = store.getActiveArtboard().nodes;
    expect(pageLayers).toHaveLength(1);
    expect(pageLayers[0]!.children!.map((layer) => layer.id)).toEqual([
      'a',
      'b',
    ]);
  });

  it('additive select toggles layers into and out of selection', () => {
    setTemplatePolicyEnforced(false);
    const provider = new LayersTreeProvider();
    const a = asDocumentNode({
      data: { fill: '#000' },
      id: 'a',
      transform: createDefaultFrame(),
      type: 'canvas.rect',
    });
    const b = asDocumentNode({
      data: { fill: '#fff' },
      id: 'b',
      transform: createDefaultFrame(),
      type: 'canvas.rect',
    });
    const { ctx, store } = createMockCommandContext(
      documentWith([flowArtboard('p1', 'p1', [a, b])]),
      { selectedIds: [], primaryId: null }
    );

    provider.onSelect?.(a, ctx);
    expect(store.getSession().selectedNodeIds).toEqual(['a']);

    provider.onSelect?.(b, ctx, { additive: true });
    expect(store.getSession().selectedNodeIds).toEqual(['a', 'b']);
    expect(store.getSession().primaryNodeId).toBe('a');

    provider.onSelect?.(a, ctx, { additive: true });
    expect(store.getSession().selectedNodeIds).toEqual(['b']);
    expect(store.getSession().primaryNodeId).toBe('b');
  });
});
