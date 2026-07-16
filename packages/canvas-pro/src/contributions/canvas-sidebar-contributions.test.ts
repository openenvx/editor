import {
  moveLayerRelativeToTarget,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  WorkbenchController,
  WorkbenchPlugin,
  type TreeItem,
  type WorkbenchPluginContext,
} from '@openenvx/headless';
import { createDefaultTransform, normalizeScene } from '@openenvx/schema';
import type { Page } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { CanvasPagesTreeProvider } from './canvas-sidebar-contributions';

class LayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return ctx.scene.getActivePage().layers;
  }

  getChildren(): Layer[] {
    return [];
  }

  getTreeItem(node: Layer): TreeItem {
    return { id: node.id, label: node.type };
  }

  handleMove(
    source: Layer,
    target: Layer,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const page = ctx.scene.getActivePage();
    const effectivePosition = position === 'inside' ? 'after' : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                layers: moveLayerRelativeToTarget(
                  p.layers,
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
  readonly id = 'test.layers';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new LayersViewContainer(), new LayersView());
    ctx.registerTreeDataProvider('layers.tree', new LayersTreeProvider());
  }
}

class PagesView extends ViewContribution {
  readonly id = 'canvas.pages';
  readonly containerId = 'pages';
  readonly name = 'Pages';
}

class PagesViewContainer extends ViewContainerContribution {
  readonly id = 'pages';
  readonly title = 'Pages';
}

class PagesPlugin extends WorkbenchPlugin {
  readonly id = 'test.pages';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new PagesViewContainer(), new PagesView());
    ctx.registerTreeDataProvider('canvas.pages', new CanvasPagesTreeProvider());
  }
}

describe('moveViewItem', () => {
  it('delegates to tree provider handleMove', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'absolute',
            layers: [
              {
                id: 'x',
                type: 'canvas.rect',
                data: { fill: '#000000' },
                transform: createDefaultTransform(),
              },
              {
                id: 'y',
                type: 'canvas.rect',
                data: { fill: '#ffffff' },
                transform: createDefaultTransform(),
              },
            ],
          },
        ],
        activePageId: 'p1',
      }),
      plugins: [new LayersPlugin()],
    });
    await controller.start();
    controller.moveViewItem(
      'layers.tree',
      {
        id: 'y',
        type: 'canvas.rect',
        data: { fill: '#ffffff' },
        transform: createDefaultTransform(),
      },
      {
        id: 'x',
        type: 'canvas.rect',
        data: { fill: '#000000' },
        transform: createDefaultTransform(),
      },
      'before'
    );
    expect(
      controller.getState().scene.pages[0]!.layers.map((l) => l.id)
    ).toStrictEqual(['y', 'x']);
  });
});

describe('CanvasPagesTreeProvider', () => {
  it('selects a page via setActivePage', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          { id: 'a', name: 'A', layout: 'flow', layers: [] },
          { id: 'b', name: 'B', layout: 'flow', layers: [] },
        ],
        activePageId: 'a',
      }),
      plugins: [new PagesPlugin()],
    });
    await controller.start();
    controller.selectViewItem('canvas.pages', {
      id: 'b',
      name: 'B',
      layout: 'flow',
      layers: [],
    });
    expect(controller.getState().selection.activePageId).toBe('b');
    expect(controller.getState().scene.pages).toHaveLength(2);
  });

  it('reorders pages via handleMove', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          { id: 'a', name: 'A', layout: 'flow', layers: [] },
          { id: 'b', name: 'B', layout: 'flow', layers: [] },
          { id: 'c', name: 'C', layout: 'flow', layers: [] },
        ],
        activePageId: 'a',
      }),
      plugins: [new PagesPlugin()],
    });
    await controller.start();
    controller.moveViewItem(
      'canvas.pages',
      { id: 'c', name: 'C', layout: 'flow', layers: [] } satisfies Page,
      { id: 'a', name: 'A', layout: 'flow', layers: [] } satisfies Page,
      'before'
    );
    expect(controller.getState().scene.pages.map((p) => p.id)).toStrictEqual([
      'c',
      'a',
      'b',
    ]);
    expect(controller.getState().selection.activePageId).toBe('a');
  });

  it('canMove rejects inside drops', () => {
    const provider = new CanvasPagesTreeProvider();
    const a = { id: 'a', name: 'A', layout: 'flow' as const, layers: [] };
    const b = { id: 'b', name: 'B', layout: 'flow' as const, layers: [] };
    expect(provider.canMove?.(a, b, 'before')).toBe(true);
    expect(provider.canMove?.(a, b, 'inside')).toBe(false);
  });
});
