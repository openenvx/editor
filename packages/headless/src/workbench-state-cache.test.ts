import {
  Command,
  createPropertyBuilder,
  LayerDefinition,
  Plugin,
} from '@openenvx/core';
import type {
  ContributionBuildContext,
  Layer,
  LayerPreviewContext,
  Page,
  PluginContext,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';
import { normalizeScene } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import { PropertyPaneContribution } from './contributions/property-pane-contribution';
import { ViewContainerContribution } from './contributions/view-contribution';
import { createPropertyPane } from './inspector/property-pane-builder';
import { WORKBENCH_INSPECTOR_CONTAINER_ID } from './workbench/inspector-container';
import { WorkbenchController } from './workbench-controller';
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';

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

class LayerSelectedPropertyPane extends PropertyPaneContribution {
  readonly id = 'test.layer-selected';
  readonly title = 'Layer Selected';

  buildDescriptor(_ctx: ContributionBuildContext) {
    return createPropertyPane(this.id, this.title)
      .when('scene.layerSelected')
      .row('Label', { key: 'label', kind: 'text', label: 'Label' })
      .build();
  }
}

class InspectorContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_INSPECTOR_CONTAINER_ID;
  readonly title = 'Inspector';
  readonly defaultLocation = 'secondary' as const;
}

class LayersContainer extends ViewContainerContribution {
  readonly id = 'test.layers';
  readonly title = 'Layers';
  readonly defaultLocation = 'primary' as const;
  readonly sidebarBehavior = 'panel' as const;
}

class InspectorWorkbenchPlugin extends WorkbenchPlugin {
  readonly id = 'inspector';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.register(new TestLayer());
    ctx.registerWorkbench(
      new LayersContainer(),
      new InspectorContainer(),
      new LayerSelectedPropertyPane()
    );
  }
}

function createAbsoluteSceneWithoutSelection() {
  return normalizeScene({
    activePageId: 'p1',
    pages: [
      {
        id: 'p1',
        name: 'Page',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [
          { id: 'a', type: 'test', data: { text: 'A' } },
          { id: 'b', type: 'test', data: { text: 'B' } },
        ],
      },
    ],
    selection: {
      activePageId: 'p1',
      primaryLayerId: null,
      selectedLayerIds: [],
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
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    controller.selectLayers(['b'], 'b');

    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore);
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

  it('updates inspector views on selection-only changes without full scene rebuild', async () => {
    const controller = new WorkbenchController({
      initialScene: createAbsoluteSceneWithoutSelection(),
      plugins: [new InspectorWorkbenchPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    const nonInspectorBefore = controller
      .getState()
      .viewContainers.filter((c) => c.id !== 'workbench.inspector');

    const paneIds = () => {
      const inspector = controller
        .getState()
        .viewContainers.find((c) => c.id === 'workbench.inspector');
      return (inspector?.views ?? [])
        .map((view) => view.id)
        .filter((id) => id === 'test.layer-selected');
    };

    expect(paneIds()).toEqual([]);

    controller.selectLayers(['a'], 'a');
    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore);
    expect(paneIds()).toEqual(['test.layer-selected']);

    const nonInspectorAfterSelect = controller
      .getState()
      .viewContainers.filter((c) => c.id !== 'workbench.inspector');
    expect(nonInspectorAfterSelect).toHaveLength(nonInspectorBefore.length);
    for (let i = 0; i < nonInspectorBefore.length; i += 1) {
      expect(nonInspectorAfterSelect[i]).toBe(nonInspectorBefore[i]);
    }

    controller.selectLayers([], null);
    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore);
    expect(paneIds()).toEqual([]);
  });
});
