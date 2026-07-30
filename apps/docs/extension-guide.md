# Canvas extension guide

How to extend the OpenEnvx canvas engine with plugins.

## Scene document (`@openenvx/schema`)

The Scene JSON format is Zod-authored. Use `validateScene` / `normalizeScene` at runtime, and `@openenvx/schema/scene.schema.json` for LLM structured output or non-TS SDKs. Content (`Scene`) is separate from editor UI state (`EditorState`); persist both via `SceneSnapshot` when needed.

Backend services depend on `@openenvx/schema` too instead of re-declaring shapes: `apps/agent-service` validates the `scene` in each chat request's `sceneContext` (editor selection travels alongside it, not inside it), and `apps/export-service` imports overlapping leaf schemas (`paddingSchema`, `layerStyleShadowSchema`, …) into its Render IR request schema while keeping Render-IR-specific document shapes local.

## OSS vs enterprise shell

| Package | Responsibility |
| --- | --- |
| `@openenvx/canvas` | Canvas engine: layers, commands, Konva renderers, `CanvasEditor` |
| `@openenvx/headless` | Workbench runtime: `WorkbenchController`, `WorkbenchPlugin`, `registerWorkbench()` |
| `@openenvx/core` | Editor host: `EditorRuntime`, `PluginManager`, `registerContribution()` |
| Your app / `demo-playground` | Wire canvas to workbench via `CanvasHostProvider` + app-owned toolbar/sidebars |
| `@openenvx/canvas-pro` (enterprise) | Pre-built canvas workbench chrome: toolbar, palette, layers sidebar, editor pane registration |

`CanvasBasicsPlugin` registers engine contributions only. For a full editor UX, either wire chrome in your app shell (see `apps/demo-playground`) or use enterprise `@openenvx/canvas-pro`.

### Custom editor host (without `WorkbenchController`)

If you build your own shell instead of `@openenvx/headless`, compose the core host like this:

```ts
import {
  EditorRuntime,
  PluginManager,
  SceneStore,
  EditorService,
  registerContribution,
} from '@openenvx/core';

const scene = new SceneStore(initialScene);
const editor = new EditorService();
const runtime = new EditorRuntime(scene, editor);
const manager = new PluginManager(runtime);

// Register workbench-specific services on runtime.services before activating plugins.
// See bootstrapWorkbenchServices() in @openenvx/headless for the headless defaults.

await manager.activateCorePlugins();
for (const plugin of plugins) {
  await manager.activate(plugin);
}

const ctx = runtime.createCommandContext();
await manager
  .getRegistries()
  .commands.execute('my.command', ctx, runtime.getEvents());

// On shutdown:
runtime.dispose();
```

Plugin contributions register through `PluginContext.register()`, which routes to `registerContribution(registries, contribution, runtime)`. Context-key contributions are stored on `EditorRuntime` and synced after each plugin activation.

### Wiring canvas in a workbench app

`@openenvx/canvas` does not depend on `@openenvx/headless`. The app bridges them:

```tsx
import { CanvasHostProvider, CanvasEditor } from '@openenvx/canvas';
import { useWorkbenchContext } from '@openenvx/headless/react';

// Provide CanvasHostApi from workbench, then mount CanvasEditor.
// See apps/demo-playground/src/components/absolute-editor-pane.tsx
```

Workbench UI contributions use `WorkbenchPlugin` and `ctx.registerWorkbench()`:

```ts
import { WorkbenchPlugin } from '@openenvx/headless';

class MyWorkbenchPlugin extends WorkbenchPlugin {
  readonly id = 'my.workbench';

  activateWorkbench(ctx) {
    ctx.registerWorkbench(new MyToolbarContribution());
  }
}
```

### Workbench views (VS Code-style)

Views use the same **declare / register** split as VS Code: view metadata is a static contribution (`contributes.views` ↔ `ViewContribution`), while the tree data is a **runtime registration** against a view id (`vscode.window.registerTreeDataProvider` ↔ `ctx.registerTreeDataProvider`). The tree data provider is a data-layer concern, not a contribution point.

1. **Declare** view metadata — `ViewContribution` (`id`, `containerId`, `name`, optional `when`) via `ctx.registerWorkbench()`.
2. **Register** tree data — `ctx.registerTreeDataProvider(viewId, provider, options?)` (optional `primary`, `order`).

```ts
import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  WorkbenchPlugin,
} from '@openenvx/headless';

class MyView extends ViewContribution {
  readonly id = 'my.view';
  readonly containerId = 'my.sidebar';
  readonly name = 'My View';
  when = 'myApp.showView'; // optional — same evaluator as toolbar/menu when clauses
}

class MyTreeProvider extends TreeDataProvider<MyNode> {
  getRootChildren(ctx) {
    return [];
  }
  getChildren() {
    return [];
  }
  getTreeItem(node) {
    return { id: node.id, label: node.label };
  }
}

class MyViewPlugin extends WorkbenchPlugin {
  readonly id = 'my.view';

  activateWorkbench(ctx) {
    ctx.registerWorkbench(new MyViewContainer(), new MyView());
    ctx.registerTreeDataProvider('my.view', new MyTreeProvider());
  }
}
```

**Hide a view** — omit its plugin from `plugins[]` (composition), or set `when` on the declaration and drive the context key from your plugin.

**Replace a tree** — register a provider with `primary` or `order`:

```ts
activateWorkbench(ctx) {
  ctx.registerWorkbench(new MyViewContainer(), new MyView());
  ctx.registerTreeDataProvider('workbench.pages', new MyPagesTreeProvider(), {
    primary: true,
  });
}
```

Resolution matches Spring `@Primary` / `@Order`: primary beats non-primary; among equals, lower `order` wins. Multiple primaries at the same order is an error.

### Workbench renderer providers

Renderer implementations are runtime provider registrations, not contribution points. Register them in `activateWorkbench()`:

```ts
activateWorkbench(ctx) {
  ctx.registerFieldRenderer('color', ColorFieldRenderer);
  ctx.registerStatusBarItemRenderer('dropdown', StatusBarDropdownRenderer);
  ctx.registerEditorPane('absolute', AbsoluteEditorPane);
}
```

Duplicate kinds overwrite earlier registrations so enterprise plugins activating later can replace OSS defaults.

`WorkbenchShell` auto-injects `DefaultWorkbenchChromePlugin` (Pages + Layers activity sidebar + dirty status). Enterprise `@xmazu/openenvxee-canvas-pro` adds canvas-only chrome (`CanvasProPlugin`, `CanvasTemplatePlugin`).

**Form / settings sidebars** (VS Code `views` + properties): declare only — no React panel:

```ts
class EmbedOptionsView extends ViewContribution {
  readonly id = 'embed.options.layer';
  readonly containerId = 'embed.options';
  readonly name = 'Layer';
  readonly collapsible = false;
  readonly when = 'scene.layerSelected';

  buildProperties(ctx: ContributionBuildContext) {
    return createPropertyPane(this.id, this.name)
      .row('Edit mode', { key: 'writeMode', kind: 'select', … }, PropertyPath.layerProp('writeMode'))
      .build();
  }
}

activateWorkbench(ctx) {
  ctx.registerWorkbench(new EmbedContainer(), new EmbedOptionsView());
}
```

**Custom React panels** (`registerViewPanel`) are only for non-form surfaces (chat, version history):

```ts
activateWorkbench(ctx) {
  ctx.registerWorkbench(new MyContainer(), new MyView()); // View.componentId set
  ctx.registerViewPanel('my.panel', MyPanel);
}
```

Include `CanvasTemplatePlugin` / `AgentChatPlugin` (or `DEFAULT_STUDIO_PLUGINS`) and the panels appear automatically.

Cloud / render API contract for named-layer modifications: [template-api-contract.md](./template-api-contract.md).

## Contribution kinds

Register canvas contributions from a plugin `activate()` hook:

```ts
import { registerCanvasContribution } from '@openenvx/canvas';

registerCanvasContribution(ctx, [
  new MyCanvasRendererContribution(),
  new MyLayerPreviewRendererContribution(),
  new MyCanvasInteractionContribution(),
]);
```

| Contribution | Registry slot | Scope |
| --- | --- | --- |
| `CanvasLayerRendererContribution` | `canvasLayerRenderers` | Per `kind` — Konva node for a layer type |
| `LayerPreviewRendererContribution` | `layerPreviewRenderers` | Per `kind` — DOM preview for a layer type |
| `CanvasLayerInteractionContribution` | `canvasLayerInteractions` | Per `kind` — transformer anchors, edit overlay, custom handles |

## Overriding built-in contributions

OSS builtins register first. Enterprise plugins activate later and can **override** a per-kind renderer or interaction:

```ts
import { registerCanvasContribution } from '@openenvx/canvas';

registerCanvasContribution(
  ctx,
  [
    new ProImageCanvasRendererContribution(),
    new ProImageInteractionContribution(),
  ],
  { override: true }
);
```

For SVG export, override the preview-kind serializer from `@openenvx/driver-image`:

```ts
import { registerPreviewKindSvgSerializer } from '@openenvx/driver-image';

registerPreviewKindSvgSerializer(ctx, new ProImageSvgSerializer(), {
  override: true,
});
```

## Generic layer handles

Contributions can register custom selection handles (crop edges, vector points, etc.) without OSS knowing the feature:

```ts
class ProImageInteraction extends ImageCanvasInteraction {
  providesHandles(view) {
    return hasActiveCrop(view);
  }

  layoutHandles(ctx) {
    return layoutCropHandles(ctx.transform, ctx.zoom);
  }

  onHandleDragMove(ctx, pointer) {
    // update live transform + drag overlays
    ctx.setOverlays?.([{ kind: 'rect', ...frame }]);
  }

  onHandleDragEnd(ctx) {
    return {
      transform: nextTransform,
      dataPatch: { crop: nextCrop },
    };
  }
}
```

OSS `CanvasStage` renders `HandleDescriptor[]` and routes pointer events back to the contribution.

## Committing enterprise layer data

Pass an optional `dataPatch` to `useCanvasApi().updateLayerTransform` when a transform also changes opaque `layer.data` fields:

```ts
await canvasApi.updateLayerTransform(layerId, nextTransform, {
  dataPatch: { crop: nextCrop },
});

// Clear a field:
await canvasApi.updateLayerTransform(layerId, nextTransform, {
  dataPatch: { crop: undefined },
});
```

Layer definitions can forward unknown data through `renderPreview` (passthrough schema) so enterprise renderers/serializers read extra preview fields without OSS naming them.

## Stage interaction service (optional)

OSS `@openenvx/canvas` does not include snapping or design-tool overlays. Optional stage behavior is registered as a **service** — no React components in the extension API.

```ts
import {
  type CanvasStageInteractionService,
  CanvasStageInteractionServiceId,
} from '@openenvx/canvas';
import { SingletonServiceContribution } from '@openenvx/core';

export class MyStageInteraction implements CanvasStageInteractionService {
  adjustDrag(input) {
    return {
      overlays: [],
      x: input.moving.bounds.x,
      y: input.moving.bounds.y,
    };
  }

  buildOverlays(_ctx) {
    return [{ kind: 'line', points: [0, 0, 100, 0] }];
  }
}

// In plugin activate():
ctx.register(
  new SingletonServiceContribution(
    CanvasStageInteractionServiceId,
    MyStageInteraction
  )
);
```

The stage controller resolves the service via `useCanvasStageInteraction()` inside a `CanvasHostProvider`, or an optional `stageInteraction` prop on `CanvasStage` (standalone embed). `adjustDrag` and `adjustResize` return adjusted coordinates plus transient `overlays` primitives; `buildOverlays` is for static overlays only. Overlays are **primitive arrays** (`line`, `rect`, `label`) painted imperatively with Konva inside canvas.

## HTML composite blocks (named slots)

`@openenvx/html` blocks can declare named **slots** — real nested part layers that stay invisible to the Layers tree.

Parts live under `data.slots`, not `data.children`. Core's tree walk only descends `data.children`, so a slotted block appears as one atomic row, cannot be dropped into, and cannot expose parts for independent delete/drag.

```ts
import type { BlockConfig } from '@openenvx/html';

export const featureBlock: BlockConfig = {
  type: 'html.feature',
  label: 'Feature',
  fields: {
    background: { kind: 'color', label: 'Background' },
  },
  defaultData: {
    background: '#ffffff',
    slots: {
      title: [{ id: '…', type: 'html.heading', data: { html: 'Title', level: '2' } }],
      actions: [{ id: '…', type: 'html.button', data: { label: 'Learn more', href: '#' } }],
    },
  },
  slots: {
    title: { label: 'Title', partType: 'html.heading' },
    actions: { label: 'Actions', partType: 'html.button', repeatable: true },
  },
  render: ({ data, slots }) => (
    <section style={{ background: String(data.background) }}>
      {slots?.title}
      <div>{slots?.actions}</div>
    </section>
  ),
};
```

- Register the config on `BlockRegistry` and via `createHtmlLayerDefinition(config)` like any other block.
- Inspector fields for slot parts are **generated** from each part type's `BlockConfig.fields` (keyed `slots.<name>.0.data.<field>`).
- Repeatable slots use the workbench `slotList` field (add/remove part layers).
- Optional single slots get a `visible` toggle (`slots.<name>.0.visible`).
- Clicking a part selects the **host** block; double-click text parts edits inline via dotted-path `updateProperty`.

See `html.hero` / `html.button` in `packages/html/src/blocks/` for the shipping reference.
