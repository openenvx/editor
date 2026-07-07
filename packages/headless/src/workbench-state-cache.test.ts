import {
  Command,
  createPropertyBuilder,
  LayerDefinition,
  Plugin,
} from '@openenvx/core';
import type {
  Layer,
  LayerPreviewContext,
  Page,
  PluginContext,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';
import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { WorkbenchController } from './workbench-controller';

class TestLayer extends LayerDefinition<{ text: string }> {
  readonly type = 'test';
  readonly treeIcon = 'text';
  readonly treeDisplayName = 'Test';

  createDefault(id: string, _page: Page): Layer {
    return { data: { text: 'hello' }, id, type: this.type };
  }

  serialize(layer: Layer) {
    return layer.data as { text: string };
  }

  deserialize(data: unknown) {
    return data as { text: string };
  }

  properties(): PropertySectionDescriptor[] {
    return createPropertyBuilder().section('test').text('text').build();
  }

  renderPreview(ctx: LayerPreviewContext<{ text: string }>) {
    return createLayerPreviewBuilder().richText(`<p>${ctx.model.text}</p>`);
  }
}

class LayerPlugin extends Plugin {
  readonly id = 'layer';

  activate(ctx: PluginContext): void {
    ctx.register(new TestLayer());
  }
}

class NoopCommand extends Command {
  readonly id = 'demo.noop';
  execute(): void {}
}

class ContextPlugin extends Plugin {
  readonly id = 'context';

  activate(ctx: PluginContext): void {
    ctx.register(new NoopCommand());
  }
}

function createSceneWithLayers() {
  return normalizeScene({
    activePageId: 'p1',
    pages: [
      {
        id: 'p1',
        name: 'Page',
        layout: 'flow',
        layers: [
          { id: 'a', type: 'test', data: { text: 'A' } },
          { id: 'b', type: 'test', data: { text: 'B' } },
        ],
      },
    ],
    selection: {
      activePageId: 'p1',
      primaryLayerId: 'a',
      selectedLayerIds: ['a'],
    },
  });
}

describe('WorkbenchStateCache', () => {
  it('does not rebuild scene slice on selection-only change', async () => {
    const controller = new WorkbenchController({
      initialScene: createSceneWithLayers(),
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const initialViewContainers = controller.getState().viewContainers;
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    controller.selectLayers(['b'], 'b');

    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore);
    expect(controller.getState().viewContainers).toBe(initialViewContainers);
    expect(controller.getState().selection.primaryLayerId).toBe('b');
  });

  it('rebuilds editor slice on selection-only change', async () => {
    const controller = new WorkbenchController({
      initialScene: createSceneWithLayers(),
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const editorRebuildsBefore = cache.rebuildCounts.editor;

    controller.selectLayers(['b'], 'b');

    expect(cache.rebuildCounts.editor).toBe(editorRebuildsBefore + 1);
  });

  it('does not rebuild editor slice on context-only change', async () => {
    const controller = new WorkbenchController({
      initialScene: createSceneWithLayers(),
      plugins: [new ContextPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const layerSurfaceBefore = controller.getState().layerSurface;
    const editorRebuildsBefore = cache.rebuildCounts.editor;

    await controller.api.executeCommand('demo.noop');

    expect(cache.rebuildCounts.editor).toBe(editorRebuildsBefore);
    expect(controller.getState().layerSurface).toBe(layerSurfaceBefore);
  });

  it('rebuilds scene slice on content change', async () => {
    const controller = new WorkbenchController({
      initialScene: createSceneWithLayers(),
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    controller.updateProperty('a', 'text', 'updated');

    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore + 1);
  });
});
