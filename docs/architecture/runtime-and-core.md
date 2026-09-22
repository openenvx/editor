# Runtime & core

**Audience:** Contributors and integrators. Package: `@openenvx/studio/core` (+ the scene schema exposed through its `./schema` entry point).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## What core owns

Plugin host primitives and the editor runtime. **No** canvas types, Konva, workbench chrome contribution points, or React shell.

| Concept | Role |
| --- | --- |
| `EditorRuntime` | Owns DI (`InstantiationService`), core service bootstrap, event bus, context-key contributions, sync, `createCommandContext()` |
| `PluginManager` | Plugin lifecycle + contribution routing only; receives `EditorRuntime` via injection |
| `Plugin` / contributions | `Command`, `LayerDefinition`, `Shortcut`, `ContextKey`, `Service`, `I18n`, `PageRulesContribution` |
| `DocumentStore` (`SceneStore` alias) | Document + transactions; applies artboard rules after structural normalize |
| `PropertyBuilder` | Layer property field/section descriptors (`LayerDefinition.properties()`) |
| `Registry<K, V>` | Keyed runtime registrations (distinct from static contributions and DI services) |

## Document model (`@openenvx/studio/schema`)

Canonical persisted JSON is Zod v4 (`documentSchemaLenient` / `documentSchemaCanonical`). No separate schema version field (MVP). Helpers: `normalizeDocument`, `validateDocument`, `nodeTransform` / `applyNodeTransform`.

| Concept | Role |
| --- | --- |
| `Document` | Content: `artboards`, optional `assets` / `components` / `variables` / `templatePolicy` |
| `Artboard` | `space` (width/height), optional `physical` (unit, dpi, bleed, safe, preset), `nodes`, `guides`, `background` |
| `DocumentNode` | `type`, `props`, optional `children`, `frame`, opacity/scale on the node |
| `EditorSession` | UI state: `activeArtboardId`, `selectedNodeIds`, `primaryNodeId` |
| `ProjectSnapshot` | Persisted pair `{ document, session }` |

Editor surface kind (canvas vs html) is **not** stored on the artboard; hosts register panes/surfaces. Optional `artboard.extensions.layout` is a product hint only.

Built-in canvas node types use typed `props`; groups/widgets nest via `children`, not `props.children`.

Render pipeline: `DocumentNode` → `NodeCompilerContribution` → `RenderDocument` (`compileArtboard` in `@openenvx/studio/preview`) → driver backends (Konva, export, …).

## Legacy names

`Scene` / `Page` / `Layer` type aliases remain in `@openenvx/studio/core` scene helpers during driver migration; prefer `Document` / `Artboard` / `DocumentNode` in new code.

## Scene document (removed)

<!-- previous Scene/Page/Layer section replaced by Document model above -->

## Bootstrap sketch (without workbench)

```ts
import {
  EditorRuntime,
  PluginManager,
  SceneStore,
  EditorService,
} from '@openenvx/studio/core';

const scene = new SceneStore(initialScene);
const editor = new EditorService();
const runtime = new EditorRuntime(scene, editor);
const manager = new PluginManager(runtime);

await manager.activateCorePlugins();
for (const plugin of plugins) {
  await manager.activate(plugin);
}

const ctx = runtime.createCommandContext();
await manager
  .getRegistries()
  .commands.execute('my.command', ctx, runtime.getEvents());

runtime.dispose();
```

Workbench apps normally go through `WorkbenchController` (see [workbench-and-headless.md](workbench-and-headless.md)), which owns the runtime and injects it into `PluginManager`.

## Contribution routing

Plugins call `ctx.register(...)`. `PluginManager` routes through `registerContribution(registries, contribution, runtime)`. Context-key contributions live on `EditorRuntime` and sync after each plugin activation.

Three registration styles in the stack:

| Style | Where | Example |
| --- | --- | --- |
| Static contribution classes | core / headless | `Command`, `ViewContribution` |
| DI services | `InstantiationService` tokens | `AssetServiceId`, canvas service ids |
| Provider registries | `Registry` keyed maps | Field renderers, editor panes, canvas renderers |

## Page rules

Providers register `PageRulesContribution` keyed by `page.layout`. `SceneStore` applies them after structural `normalizeScene` - e.g. absolute page dims / presets from canvas, HTML-specific constraints from html.

## What does **not** belong in core

- Konva / canvas renderers, interactions, `CanvasEditor`
- Workbench UI points: toolbar, palette, views, editor panes, property **panes**, field **renderers**
- Product React chrome
- Embed/sandbox host adapters (those are headless surfaces + workbench hosts)

## Related

- Author API (internal plugins): [apps/docs/extension-guide.md](../../apps/docs/extension-guide.md) · hub: [apps/docs/README.md](../../apps/docs/README.md)
- Property **pane** builders and workbench merge: [workbench-and-headless.md](workbench-and-headless.md)
