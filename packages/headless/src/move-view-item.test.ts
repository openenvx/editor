import {
  getActivePage,
  moveLayerRelativeToTarget,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import { createDefaultTransform, normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
} from './contributions/view-contribution';
import { WorkbenchController } from './workbench-controller';
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';

class LayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return getActivePage(ctx.scene.getScene()).layers;
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
    const page = getActivePage(ctx.scene.getScene());
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

  createProvider(): TreeDataProvider<Layer> {
    return new LayersTreeProvider();
  }
}

class LayersViewContainer extends ViewContainerContribution {
  readonly id = 'layers';
  readonly title = 'Layers';
}

class LayersPlugin extends WorkbenchPlugin {
  readonly id = 'test.layers';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new LayersViewContainer(), new LayersView());
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
