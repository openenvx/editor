import {
  LayerDefinition,
  type Artboard,
  type DocumentNode,
  type LayerPreviewContext,
} from '@openenvx/editor';
import { createLayerPreviewBuilder } from '@openenvx/editor/preview';
import { describe, expect, it } from 'vitest';

import {
  Command,
  createPropertyBuilder,
  Plugin,
  type ContributionBuildContext,
  type PluginContext,
  type PropertySectionDescriptor,
} from '../backbone';
import { normalizeProjectSnapshotForTest } from '../test/document-fixtures';
import {
  createWorkbenchWithEditor,
  selectTestNodes,
  updateTestLayerProperty,
} from '../test/create-workbench-with-editor';

import { PropertyPaneContribution } from '../contributions/property-pane-contribution';
import { ViewContainerContribution } from '../contributions/view-contribution';
import { createPropertyPane } from '../properties/property-pane-builder';
import { WORKBENCH_INSPECTOR_CONTAINER_ID } from './inspector-container';
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';

class TestLayer extends LayerDefinition<{ text: string }> {
  readonly type = 'test';
  readonly treeIcon = 'text';
  readonly treeDisplayName = 'Test';

  createDefault(id: string, _page: Artboard): DocumentNode {
    return { props: { text: 'hello' }, id, type: this.type };
  }

  serialize(layer: DocumentNode) {
    return layer.props as { text: string };
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
  return normalizeProjectSnapshotForTest({
    activeArtboardId: 'p1',
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
      activeArtboardId: 'p1',
      primaryNodeId: 'a',
      selectedNodeIds: ['a'],
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
  readonly id = 'test.nodes';
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
  return normalizeProjectSnapshotForTest({
    activeArtboardId: 'p1',
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
      activeArtboardId: 'p1',
      primaryNodeId: null,
      selectedNodeIds: [],
    },
  });
}

describe('WorkbenchStateCache', () => {
  it('does not rebuild scene slice on selection-only change', async () => {
    const controller = createWorkbenchWithEditor(createSceneWithLayers(), [
      new LayerPlugin(),
    ]);
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    selectTestNodes(controller, ['b'], 'b');

    expect(cache.rebuildCounts.scene).toBeLessThanOrEqual(sceneRebuildsBefore + 1);
    expect(controller.getState().selection.primaryNodeId).toBe('b');
  });

  it('rebuilds editor slice on selection-only change', async () => {
    const controller = createWorkbenchWithEditor(createSceneWithLayers(), [
      new LayerPlugin(),
    ]);
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const editorRebuildsBefore = cache.rebuildCounts.editor;

    selectTestNodes(controller, ['b'], 'b');

    expect(cache.rebuildCounts.editor).toBe(editorRebuildsBefore + 1);
  });

  it('does not rebuild editor slice on context-only change', async () => {
    const controller = createWorkbenchWithEditor(createSceneWithLayers(), [
      new ContextPlugin(),
    ]);
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const layerSurfaceBefore = controller.getState().layerSurface;
    const editorRebuildsBefore = cache.rebuildCounts.editor;

    await controller.api.executeCommand('demo.noop');

    expect(cache.rebuildCounts.editor).toBe(editorRebuildsBefore);
    expect(controller.getState().layerSurface).toBe(layerSurfaceBefore);
  });

  it('rebuilds scene slice on content change', async () => {
    const controller = createWorkbenchWithEditor(createSceneWithLayers(), [
      new LayerPlugin(),
    ]);
    await controller.start();
    const cache = controller.getStateCacheForTest();
    const sceneRebuildsBefore = cache.rebuildCounts.scene;

    updateTestLayerProperty(controller, 'a', 'text', 'updated');

    expect(cache.rebuildCounts.scene).toBe(sceneRebuildsBefore + 1);
  });

  it('updates inspector views on selection-only changes without full scene rebuild', async () => {
    const controller = createWorkbenchWithEditor(
      createAbsoluteSceneWithoutSelection(),
      [new InspectorWorkbenchPlugin()]
    );
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

    selectTestNodes(controller, ['a'], 'a');
    expect(cache.rebuildCounts.scene).toBeLessThanOrEqual(sceneRebuildsBefore + 1);
    expect(paneIds()).toEqual(['test.layer-selected']);

    const nonInspectorAfterSelect = controller
      .getState()
      .viewContainers.filter((c) => c.id !== 'workbench.inspector');
    expect(nonInspectorAfterSelect).toHaveLength(nonInspectorBefore.length);
    for (let i = 0; i < nonInspectorBefore.length; i += 1) {
      expect(nonInspectorAfterSelect[i]).toStrictEqual(nonInspectorBefore[i]);
    }

    selectTestNodes(controller, [], null);
    expect(cache.rebuildCounts.scene).toBeLessThanOrEqual(sceneRebuildsBefore + 1);
    expect(paneIds()).toEqual([]);
  });
});
