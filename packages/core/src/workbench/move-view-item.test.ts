import {
  moveLayerRelativeToTarget,
} from '../backbone';
import type { CommandContext, Layer } from '../backbone';
import { createDefaultTransform, normalizeScene } from '@openenvx/core/schema';
import { describe, expect, it } from 'vitest';

import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
} from '../contributions/view-contribution';
import { ViewProviderRegistryImpl } from '../registries/view-provider-registry';
import { WorkbenchController } from './workbench-controller';
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';

class LayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return ctx.scene.getActivePage().layers;
  }

  getChildren(): Layer[] {
    return [];
  }

  getTreeItem(node: Layer) {
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

describe('moveViewItem', () => {
  it('delegates to tree provider handleMove', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
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

describe('view when clause', () => {
  class HiddenView extends ViewContribution {
    readonly id = 'hidden.view';
    readonly containerId = 'layers';
    readonly name = 'Hidden';
    readonly when = 'test.showHiddenView';
  }

  class HiddenViewPlugin extends WorkbenchPlugin {
    readonly id = 'test.hidden-view';

    activateWorkbench(ctx: WorkbenchPluginContext): void {
      ctx.registerWorkbench(new LayersViewContainer(), new HiddenView());
      ctx.registerTreeDataProvider('hidden.view', new LayersTreeProvider());
    }
  }

  it('omits views when when clause is false', async () => {
    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'absolute',
            width: 800,
            height: 600,
            layers: [],
          },
        ],
        activePageId: 'p1',
      }),
      plugins: [new HiddenViewPlugin()],
    });
    await controller.start();
    const containers = controller.getState().viewContainers;
    expect(containers).toHaveLength(1);
    expect(containers[0]!.views).toStrictEqual([]);
  });
});

describe('registerTreeDataProvider primary and order', () => {
  it('prefers primary registration over default registration', async () => {
    class PrimaryPlugin extends WorkbenchPlugin {
      readonly id = 'test.primary';

      activateWorkbench(ctx: WorkbenchPluginContext): void {
        ctx.registerWorkbench(new LayersViewContainer(), new LayersView());
        ctx.registerTreeDataProvider('layers.tree', new LayersTreeProvider());
        ctx.registerTreeDataProvider('layers.tree', new LayersTreeProvider(), {
          primary: true,
        });
      }
    }

    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'absolute',
            width: 800,
            height: 600,
            layers: [],
          },
        ],
        activePageId: 'p1',
      }),
      plugins: [new PrimaryPlugin()],
    });
    await controller.start();
    expect(controller.getState().viewContainers[0]!.views).toHaveLength(1);
  });

  it('prefers lower order when no primary is set', async () => {
    class OrderPlugin extends WorkbenchPlugin {
      readonly id = 'test.order';

      activateWorkbench(ctx: WorkbenchPluginContext): void {
        ctx.registerWorkbench(new LayersViewContainer(), new LayersView());
        ctx.registerTreeDataProvider('layers.tree', new LayersTreeProvider(), {
          order: 10,
        });
        ctx.registerTreeDataProvider('layers.tree', new LayersTreeProvider(), {
          order: 0,
        });
      }
    }

    const controller = new WorkbenchController({
      initialScene: normalizeScene({
        pages: [
          {
            id: 'p1',
            name: 'Page',
            layout: 'absolute',
            width: 800,
            height: 600,
            layers: [],
          },
        ],
        activePageId: 'p1',
      }),
      plugins: [new OrderPlugin()],
    });
    await controller.start();
    expect(controller.getState().viewContainers[0]!.views).toHaveLength(1);
  });
});

describe('ViewProviderRegistryImpl', () => {
  it('allows multiple registrations for the same view id', () => {
    const registry = new ViewProviderRegistryImpl();
    const first = new LayersTreeProvider();
    const second = new LayersTreeProvider();
    registry.registerTreeDataProvider('layers.tree', first);
    registry.registerTreeDataProvider('layers.tree', second);
    expect(registry.get('layers.tree')).toBe(first);
  });

  it('prefers lower order when no primary is set', () => {
    const registry = new ViewProviderRegistryImpl();
    const low = new LayersTreeProvider();
    const high = new LayersTreeProvider();
    registry.registerTreeDataProvider('layers.tree', high, { order: 10 });
    registry.registerTreeDataProvider('layers.tree', low, { order: 0 });
    expect(registry.get('layers.tree')).toBe(low);
  });

  it('prefers primary over non-primary regardless of order', () => {
    const registry = new ViewProviderRegistryImpl();
    const builtin = new LayersTreeProvider();
    const custom = new LayersTreeProvider();
    registry.registerTreeDataProvider('layers.tree', builtin, { order: 0 });
    registry.registerTreeDataProvider('layers.tree', custom, {
      order: 100,
      primary: true,
    });
    expect(registry.get('layers.tree')).toBe(custom);
  });

  it('throws when multiple primaries share the same order', () => {
    const registry = new ViewProviderRegistryImpl();
    registry.registerTreeDataProvider('layers.tree', new LayersTreeProvider(), {
      primary: true,
      order: 0,
    });
    registry.registerTreeDataProvider('layers.tree', new LayersTreeProvider(), {
      primary: true,
      order: 0,
    });
    expect(() => registry.get('layers.tree')).toThrow(
      'Multiple primary TreeDataProvider registrations with order 0 for one view'
    );
  });
});
