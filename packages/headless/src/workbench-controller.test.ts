import { createLayerPreviewBuilder } from '@openenvx/preview';
import {
  Command,
  createPropertyBuilder,
  LayerDefinition,
  Plugin,
  WorkbenchEvents,
} from '@openenvx/core';
import type {
  CommandContext,
  Layer,
  LayerPreviewContext,
  Page,
  PluginContext,
  PropertySectionDescriptor,
} from '@openenvx/core';
import { normalizeScene, normalizeSceneSnapshot } from '@openenvx/schema';
import { describe, expect, it, vi } from "vitest";

import {
  CommandPaletteContribution,
} from './contributions/command-palette-contribution';
import { ToolbarContribution } from './contributions/toolbar-contribution';
import type { CommandPaletteBuilder } from './builders/command-palette-builder';
import type { ToolbarBuilder } from './builders/toolbar-builder';
import { WorkbenchController } from "./workbench-controller";
import { WorkbenchPlugin } from './workbench-plugin';
import type { WorkbenchPluginContext } from './workbench-plugin-context';

class TestLayer extends LayerDefinition<{ text: string }> {
  readonly type = "test";
  readonly treeIcon = "text";
  readonly treeDisplayName = "Test";

  createDefault(id: string, _page: Page): Layer {
    return { data: { text: "hello" }, id, type: this.type };
  }

  serialize(layer: Layer) {
    return layer.data as { text: string };
  }

  deserialize(data: unknown) {
    return data as { text: string };
  }

  properties(): PropertySectionDescriptor[] {
    return createPropertyBuilder().section("test").text("text").build();
  }

  renderPreview(ctx: LayerPreviewContext<{ text: string }>) {
    return createLayerPreviewBuilder().richText(`<p>${ctx.model.text}</p>`);
  }
}

class LayerPlugin extends Plugin {
  readonly id = "layer";

  activate(ctx: PluginContext): void {
    ctx.register(new TestLayer());
  }
}

class EmptyPlugin extends Plugin {
  readonly id = "empty";
  activate() {}
}

class PaletteCommand extends Command {
  readonly id = "demo.run";

  execute(_ctx: CommandContext): void {}
}

class PalettePlugin extends WorkbenchPlugin {
  readonly id = "palette";

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.register(new PaletteCommand());
    ctx.registerWorkbench(new DemoPaletteContribution());
  }
}

class DemoPaletteContribution extends CommandPaletteContribution {
  contribute(builder: CommandPaletteBuilder, _ctx): void {
    builder.category("demo", "Demo");
    builder.item("demo.run").label("Run demo").category("demo");
  }
}

class DemoToolbarContribution extends ToolbarContribution {
  contribute(builder: ToolbarBuilder, _ctx): void {
    builder
      .command('toolbar-visible', {
        commandId: 'scene.undo',
        icon: 'undo',
        labelKey: 'undo',
        priority: 1,
      })
      .command('toolbar-hidden', {
        commandId: 'scene.redo',
        icon: 'redo',
        labelKey: 'redo',
        priority: 2,
        when: 'never.true',
      })
      .separator('toolbar-separator', { priority: 3 });
  }
}

class ToolbarPlugin extends WorkbenchPlugin {
  readonly id = 'toolbar';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new DemoToolbarContribution());
  }
}

describe(WorkbenchController, () => {
  it("merges empty state", async () => {
    const controller = new WorkbenchController({
      plugins: [new EmptyPlugin()],
    });
    await controller.start();
    const state = controller.getState();
    expect(state.interaction.hoveredLayerId).toBeNull();
    expect(state.commandPalette.items.length).toBeGreaterThan(0);
    expect(
      state.commandPalette.items.some((item) => item.commandId === 'scene.undo')
    ).toBe(true);
  });

  it("merges toolbar items and filters by when", async () => {
    const controller = new WorkbenchController({
      plugins: [new ToolbarPlugin()],
    });
    await controller.start();
    const items = controller.getState().toolbarItems;
    expect(items.map((item) => item.id)).toEqual([
      'toolbar-visible',
      'toolbar-separator',
    ]);
  });

  it("reuses cached command palette when selection changes without context key changes", async () => {
    const snapshot = normalizeSceneSnapshot({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "flow",
          layers: [
            { id: "a", type: "test", data: { text: "A" } },
            { id: "b", type: "test", data: { text: "B" } },
          ],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "a",
        selectedLayerIds: ["a"],
      },
    });
    const controller = new WorkbenchController({
      initialEditorState: snapshot.editorState,
      initialScene: snapshot.scene,
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    const initialPalette = controller.getState().commandPalette;
    controller.selectLayers(["b"], "b");
    expect(controller.getState().commandPalette).toBe(initialPalette);
  });

  it("builds command palette from registered commands and contributions", async () => {
    const controller = new WorkbenchController({
      plugins: [new PalettePlugin()],
    });
    await controller.start();
    const state = controller.getState();

    expect(
      state.commandPalette.items.find((item) => item.commandId === 'demo.run')
    ).toMatchObject({
      categoryId: 'demo',
      commandId: 'demo.run',
      label: 'Run demo',
    });
    expect(state.commandPalette.categories).toContainEqual({
      id: "demo",
      label: "Demo",
    });
  });

  it("renders layerSurface from layer registry", async () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "flow",
          layers: [{ id: "1", type: "test", data: { text: "world" } }],
        },
      ],
    });
    const controller = new WorkbenchController({
      initialScene: scene,
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    const state = controller.getState();
    expect(state.layerSurface[0]!.view).toStrictEqual({
      html: "<p>world</p>",
      kind: "richText",
    });
  });

  it("updates properties via updateProperty", async () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "flow",
          layers: [{ id: "1", type: "test", data: { text: "before" } }],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "1",
        selectedLayerIds: ["1"],
      },
    });
    const controller = new WorkbenchController({
      initialScene: scene,
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    controller.updateProperty("1", "text", "after");
    const layer = controller.getState().scene.pages[0]!.layers[0]!;
    expect((layer.data as { text: string }).text).toBe("after");
  });

  it("writes bound face html into nested widget values paths", async () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "html",
          layers: [
            {
              id: "root",
              type: "html.root",
              data: {
                children: [
                  {
                    id: "widget-1",
                    type: "openenvx.widget",
                    data: {
                      extensionId: "wm.menu",
                      values: {
                        sections: [{ title: "Zupa", dishes: [{ name: "Rosół" }] }],
                      },
                      children: [
                        {
                          id: "face-title",
                          type: "html.heading",
                          writeMode: "content",
                          data: {
                            html: "Zupa",
                            bind: "sections.0.title",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "face-title",
        selectedLayerIds: ["face-title"],
      },
    });
    const controller = new WorkbenchController({
      initialScene: scene,
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    controller.updateProperty("face-title", "html", "<p>Zupa weselna</p>");
    const root = controller.getState().scene.pages[0]!.layers[0]!;
    const widget = (root.data as { children: { data: Record<string, unknown> }[] })
      .children[0]!;
    const values = widget.data.values as {
      sections: { title: string }[];
    };
    expect(values.sections[0]!.title).toBe("Zupa weselna");
  });

  it("undo restores nested widget bind values after face html edit", async () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "html",
          layers: [
            {
              id: "root",
              type: "html.root",
              data: {
                children: [
                  {
                    id: "widget-1",
                    type: "openenvx.widget",
                    data: {
                      extensionId: "wm.menu",
                      values: {
                        sections: [{ title: "Zupa", dishes: [{ name: "Rosół" }] }],
                      },
                      children: [
                        {
                          id: "face-title",
                          type: "html.heading",
                          writeMode: "content",
                          data: {
                            html: "Zupa",
                            bind: "sections.0.title",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "face-title",
        selectedLayerIds: ["face-title"],
      },
    });
    const controller = new WorkbenchController({
      initialScene: scene,
      plugins: [new LayerPlugin()],
    });
    await controller.start();
    controller.updateProperty("face-title", "html", "<p>Zupa weselna</p>");
    expect(controller.undo()).toBe(true);
    const root = controller.getState().scene.pages[0]!.layers[0]!;
    const widget = (root.data as { children: { data: Record<string, unknown> }[] })
      .children[0]!;
    const values = widget.data.values as {
      sections: { title: string }[];
    };
    expect(values.sections[0]!.title).toBe("Zupa");
    expect((widget.data.children as { data: { html: string } }[])[0]!.data.html).toBe(
      "Zupa"
    );
  });

  it("does not delete the selected layer while typing in an input", async () => {
    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "flow",
          layers: [{ id: "1", type: "test", data: { text: "before" } }],
        },
      ],
      selection: {
        activePageId: "p1",
        primaryLayerId: "1",
        selectedLayerIds: ["1"],
      },
    });

    const listeners: {
      keydown: ((event: KeyboardEvent) => void) | null;
    } = { keydown: null };
    const activeInput = { isContentEditable: false, tagName: "INPUT" };
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;

    const windowStub = {
      addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => {
        if (type === "keydown" && typeof listener === "function") {
          listeners.keydown = listener as (event: KeyboardEvent) => void;
        }
      },
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;

    const documentStub = {
      activeElement: activeInput,
    } as unknown as Document;

    globalThis.window = windowStub;
    globalThis.document = documentStub;

    try {
      const controller = new WorkbenchController({
        initialScene: scene,
        plugins: [new LayerPlugin()],
      });
      await controller.start();

      const event = {
        altKey: false,
        ctrlKey: false,
        key: "Delete",
        metaKey: false,
        preventDefault: vi.fn(),
        shiftKey: false,
      } as unknown as KeyboardEvent;

      expect(listeners.keydown).toBeTypeOf("function");
      const keydownListener = listeners.keydown;
      if (!keydownListener) {
        throw new Error("Expected keydown listener to be registered");
      }
      keydownListener(event);
      await Promise.resolve();

      const page = controller.getState().scene.pages[0];
      expect(page).toBeDefined();
      expect(page?.layers).toHaveLength(1);
    } finally {
      globalThis.window = previousWindow;
      globalThis.document = previousDocument;
    }
  });

  it("resolves asset refs in image previews", async () => {
    const { AssetServiceId, InMemoryAssetService, SingletonServiceContribution } =
      await import('@openenvx/core');

    class ImageLayer extends LayerDefinition<{ assetRef: string }> {
      readonly type = "asset-image";
      readonly treeIcon = "image";
      readonly treeDisplayName = "Image";

      createDefault(id: string, _page: Page): Layer {
        return { data: { assetRef: "asset://x" }, id, type: this.type };
      }

      serialize(layer: Layer) {
        return layer.data as { assetRef: string };
      }

      deserialize(data: unknown) {
        return data as { assetRef: string };
      }

      properties(): PropertySectionDescriptor[] {
        return [];
      }

      renderPreview(ctx: LayerPreviewContext<{ assetRef: string }>) {
        return createLayerPreviewBuilder().image(ctx.model.assetRef);
      }
    }

    class AssetPlugin extends Plugin {
      readonly id = "assets";

      activate(ctx: PluginContext): void {
        ctx.register(
          new ImageLayer(),
          new SingletonServiceContribution(AssetServiceId, InMemoryAssetService)
        );
        const assets = ctx.services.get(AssetServiceId);
        assets.register("x", { data: "eHk=", encoding: "base64", mimeType: "image/png" });
      }
    }

    const scene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "absolute",
          width: 800,
          height: 600,
          layers: [
            { id: "1", type: "asset-image", data: { assetRef: "asset://x" } },
          ],
        },
      ],
    });

    const controller = new WorkbenchController({
      initialScene: scene,
      plugins: [new AssetPlugin()],
    });
    await controller.start();
    const {view} = controller.getState().layerSurface[0]!;
    expect(view).toStrictEqual({
      alt: undefined,
      kind: "image",
      src: "data:image/png;base64,eHk=",
    });
  });

  it("hydrates assets on openDocument and exports referenced assets on save", async () => {
    const {
      AssetServiceId,
      InMemoryAssetService,
      InMemoryPersistenceService,
      PersistenceServiceId,
      SingletonServiceContribution,
      SimpleServiceContribution,
    } = await import('@openenvx/core');

    class ImageLayer extends LayerDefinition<{ assetRef: string }> {
      readonly type = "asset-image";
      readonly treeIcon = "image";
      readonly treeDisplayName = "Image";

      createDefault(id: string, _page: Page): Layer {
        return { data: { assetRef: "asset://x" }, id, type: this.type };
      }

      serialize(layer: Layer) {
        return layer.data as { assetRef: string };
      }

      deserialize(data: unknown) {
        return data as { assetRef: string };
      }

      properties(): PropertySectionDescriptor[] {
        return [];
      }

      renderPreview(ctx: LayerPreviewContext<{ assetRef: string }>) {
        return createLayerPreviewBuilder().image(ctx.model.assetRef);
      }
    }

    class PersistPlugin extends Plugin {
      readonly id = "persist";

      activate(ctx: PluginContext): void {
        ctx.register(
          new ImageLayer(),
          new SingletonServiceContribution(AssetServiceId, InMemoryAssetService),
          new SimpleServiceContribution(PersistenceServiceId, () => new InMemoryPersistenceService())
        );
        const assets = ctx.services.get(AssetServiceId);
        assets.register("x", { data: "eHk=", encoding: "base64", mimeType: "image/png" });
      }
    }

    const initialScene = normalizeScene({
      activePageId: "p1",
      pages: [
        {
          id: "p1",
          name: "Page",
          layout: "absolute",
          width: 800,
          height: 600,
          layers: [
            { id: "1", type: "asset-image", data: { assetRef: "asset://x" } },
          ],
        },
      ],
    });

    const controller = new WorkbenchController({
      initialScene,
      plugins: [new PersistPlugin()],
    });
    await controller.start();
    await controller.saveAs("doc://test");

    await controller.openDocument("doc://test");

    const state = controller.getState();
    expect(state.scene.assets).toEqual({
      x: { data: "eHk=", encoding: "base64", mimeType: "image/png" },
    });
    const view = state.layerSurface[0]!.view;
    expect(view).toStrictEqual({
      alt: undefined,
      kind: "image",
      src: "data:image/png;base64,eHk=",
    });
  });

  it("rejects invalid scenes on loadScene", async () => {
    const { SceneValidationError } = await import('@openenvx/core');
    const { SCHEMA_VERSION } = await import('@openenvx/schema');
    const controller = new WorkbenchController({
      plugins: [new EmptyPlugin()],
    });
    await controller.start();
    expect(() =>
      controller.loadScene({
        schemaVersion: SCHEMA_VERSION + 100,
        activePageId: "p1",
        pages: [
          {
            id: "p1",
            name: "Page",
            layout: "flow",
            layers: [],
          },
        ],
        selection: {
          activePageId: "p1",
          primaryLayerId: null,
          selectedLayerIds: [],
        },
      })
    ).toThrow(SceneValidationError);
  });

  it("loadScene pushes history so undo restores the prior scene", async () => {
    const { SCHEMA_VERSION } = await import('@openenvx/schema');
    const controller = new WorkbenchController({
      plugins: [new EmptyPlugin()],
    });
    await controller.start();
    const beforeName = controller.getState().scene.pages[0]!.name;

    controller.loadScene({
      schemaVersion: SCHEMA_VERSION,
      pages: [
        {
          id: "tpl",
          name: "Template",
          layout: "email",
          layers: [],
        },
      ],
    });
    expect(controller.getState().scene.pages[0]!.name).toBe("Template");
    expect(controller.api.scene.canUndo()).toBe(true);
    expect(controller.api.scene.undo()).toBe(true);
    expect(controller.getState().scene.pages[0]!.name).toBe(beforeName);
  });

  it("setHoveredLayer updates state without rebuilding scene slice", async () => {
    const controller = new WorkbenchController({
      plugins: [new EmptyPlugin()],
    });
    await controller.start();
    const cache = controller.getStateCacheForTest();
    cache.rebuildCounts.scene = 0;

    const interactionHandler = vi.fn();
    const dispose = controller.api.events.on(
      WorkbenchEvents.DidChangeInteraction,
      interactionHandler
    );

    controller.api.setHoveredLayer("layer-a");
    expect(controller.getState().interaction.hoveredLayerId).toBe("layer-a");
    expect(cache.rebuildCounts.scene).toBe(0);
    expect(interactionHandler).toHaveBeenCalledTimes(1);
    expect(interactionHandler).toHaveBeenLastCalledWith({
      hoveredLayerId: "layer-a",
    });

    controller.api.setHoveredLayer("layer-a");
    expect(cache.rebuildCounts.scene).toBe(0);
    expect(interactionHandler).toHaveBeenCalledTimes(1);

    controller.api.setHoveredLayer(null);
    expect(controller.getState().interaction.hoveredLayerId).toBeNull();
    expect(interactionHandler).toHaveBeenCalledTimes(2);
    expect(interactionHandler).toHaveBeenLastCalledWith({
      hoveredLayerId: null,
    });

    dispose();
  });
});
