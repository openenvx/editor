import {
  Command,
  LayerDefinition,
  Plugin,
  type ContributionBuildContext,
  type Layer,
  type LayerPreviewContext,
  type Page,
  type PluginContext,
  type PropertySectionDescriptor,
  createPropertyBuilder,
} from '@openenvx/core';
import { createLayerPreviewBuilder } from '@openenvx/preview';
import { normalizeSceneSnapshot } from '@openenvx/schema';
import { describe, expect, it } from 'vitest';

import {
  ViewContainerContribution,
  ViewContribution,
} from './contributions/view-contribution';
import { createPropertyPane } from './properties/property-pane-builder';
import { PropertyPath } from './properties/property-path';
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

class EmbedContainer extends ViewContainerContribution {
  readonly id = 'test.embed';
  readonly title = 'Embed';
  readonly defaultLocation = 'secondary' as const;
  readonly sidebarBehavior = 'panel' as const;
}

class EmbedLayerView extends ViewContribution {
  readonly id = 'test.embed.layer';
  readonly containerId = 'test.embed';
  readonly name = 'Layer';
  readonly collapsible = false;
  readonly when = 'scene.layerSelected';
  readonly viewOrder = 0;

  buildProperties(_ctx: ContributionBuildContext) {
    return createPropertyPane(this.id, this.name)
      .row(
        'Edit mode',
        {
          key: 'writeMode',
          kind: 'select',
          label: 'Edit mode',
          options: [{ label: 'Free', value: 'free' }],
        },
        PropertyPath.layerProp('writeMode')
      )
      .headerToggle(PropertyPath.layerProp('showInLayers'))
      .build();
  }
}

class EmbedWelcomeView extends ViewContribution {
  readonly id = 'test.embed.welcome';
  readonly containerId = 'test.embed';
  readonly name = 'Welcome';
  readonly collapsible = false;
  readonly when = '!scene.layerSelected';
  readonly emptyMessage = 'Select a layer…';
  readonly viewOrder = 0;
}

class EmbedPolicyView extends ViewContribution {
  readonly id = 'test.embed.policy';
  readonly containerId = 'test.embed';
  readonly name = 'Policy';
  readonly collapsible = false;
  readonly viewOrder = 1;

  buildProperties(_ctx: ContributionBuildContext) {
    return createPropertyPane(this.id, this.name)
      .row(
        'Allow insert',
        {
          key: 'allowInsertLayers',
          kind: 'toggle',
          label: 'Allow insert',
        },
        PropertyPath.templatePolicy('allowInsertLayers')
      )
      .build();
  }
}

class EmbedWorkbenchPlugin extends WorkbenchPlugin {
  readonly id = 'embed-test';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new EmbedContainer(),
      new EmbedLayerView(),
      new EmbedWelcomeView(),
      new EmbedPolicyView()
    );
  }
}

function sceneWithSelection() {
  return normalizeSceneSnapshot({
    activePageId: 'p1',
    pages: [
      {
        id: 'p1',
        name: 'Page',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [{ id: 'a', type: 'test', data: { text: 'A' } }],
      },
    ],
    selection: {
      activePageId: 'p1',
      primaryLayerId: 'a',
      selectedLayerIds: ['a'],
    },
  });
}

function sceneWithoutSelection() {
  return normalizeSceneSnapshot({
    activePageId: 'p1',
    pages: [
      {
        id: 'p1',
        name: 'Page',
        layout: 'absolute',
        width: 800,
        height: 600,
        layers: [{ id: 'a', type: 'test', data: { text: 'A' } }],
      },
    ],
    selection: {
      activePageId: 'p1',
      primaryLayerId: null,
      selectedLayerIds: [],
    },
  });
}

describe('ViewContribution.buildProperties', () => {
  it('emits properties views with headerToggle and welcome when', async () => {
    const snapshot = sceneWithSelection();
    const controller = new WorkbenchController({
      initialEditorState: snapshot.editorState,
      initialScene: snapshot.scene,
      plugins: [new LayerPlugin(), new ContextPlugin(), new EmbedWorkbenchPlugin()],
    });
    await controller.start();

    const embed = controller
      .getState()
      .viewContainers.find((c) => c.id === 'test.embed');
    expect(embed).toBeDefined();
    const kinds = embed?.views.map((v) => ({
      hasHeaderToggle:
        v.content.kind === 'properties' && v.content.headerToggle !== undefined,
      id: v.id,
      kind: v.content.kind,
    }));
    expect(kinds).toEqual([
      {
        hasHeaderToggle: true,
        id: 'test.embed.layer',
        kind: 'properties',
      },
      {
        hasHeaderToggle: false,
        id: 'test.embed.policy',
        kind: 'properties',
      },
    ]);
  });

  it('shows welcome view when no layer is selected', async () => {
    const snapshot = sceneWithoutSelection();
    const controller = new WorkbenchController({
      initialEditorState: snapshot.editorState,
      initialScene: snapshot.scene,
      plugins: [new LayerPlugin(), new ContextPlugin(), new EmbedWorkbenchPlugin()],
    });
    await controller.start();

    const embed = controller
      .getState()
      .viewContainers.find((c) => c.id === 'test.embed');
    const kinds = embed?.views.map((v) => ({
      id: v.id,
      kind: v.content.kind,
      message: v.content.kind === 'welcome' ? v.content.message : undefined,
    }));
    expect(kinds).toEqual([
      {
        id: 'test.embed.welcome',
        kind: 'welcome',
        message: 'Select a layer…',
      },
      {
        id: 'test.embed.policy',
        kind: 'properties',
        message: undefined,
      },
    ]);
  });
});
