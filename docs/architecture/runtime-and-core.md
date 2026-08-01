# Runtime & core

**Audience:** Internal engineers and coding agents. Package: `@openenvx/core` (+ `@openenvx/schema` for the document).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## What core owns

Plugin host primitives and the editor runtime. **No** canvas types, Konva, workbench chrome contribution points, or React shell.

| Concept | Role |
| --- | --- |
| `EditorRuntime` | Owns DI (`InstantiationService`), core service bootstrap, event bus, context-key contributions, sync, `createCommandContext()` |
| `PluginManager` | Plugin lifecycle + contribution routing only; receives `EditorRuntime` via injection |
| `Plugin` / contributions | `Command`, `LayerDefinition`, `Shortcut`, `ContextKey`, `Service`, `I18n`, `PageRulesContribution` |
| `SceneStore` | Scene document + transactions; applies page rules after structural normalize |
| `PropertyBuilder` | Layer property field/section descriptors (`LayerDefinition.properties()`) |
| `Registry<K, V>` | Keyed runtime registrations (distinct from static contributions and DI services) |

## Scene document (`@openenvx/schema`)

Canonical content Scene JSON is Zod v4 (`sceneSchemaLenient` / `sceneSchemaCanonical`). Defaults, `validateScene` / `normalizeScene`, and published `scene.schema.json` come from that schema.

| Concept | Role |
| --- | --- |
| `Scene` | Content only: `schemaVersion`, `pages`, optional `assets` / `templatePolicy` |
| `EditorState` | UI state: `activePageId`, `selectedLayerIds`, `primaryLayerId` |
| `SceneSnapshot` | Persisted pair `{ scene, editorState }` |

`Page.layout` is a **provider-defined string** (e.g. `'absolute'`, `'html'`). Schema normalization is structural only; layout-specific rules (dims, presets, validation) register via `PageRulesContribution` in core.

Built-in canvas layer types have typed `data`; unknown plugin types use an escape hatch.

## Bootstrap sketch (without workbench)

```ts
import {
  EditorRuntime,
  PluginManager,
  SceneStore,
  EditorService,
} from '@openenvx/core';

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

Providers register `PageRulesContribution` keyed by `page.layout`. `SceneStore` applies them after structural `normalizeScene` — e.g. absolute page dims / presets from canvas, HTML-specific constraints from html.

## What does **not** belong in core

- Konva / canvas renderers, interactions, `CanvasEditor`
- Workbench UI points: toolbar, palette, views, editor panes, property **panes**, field **renderers**
- Product React chrome
- Embed/sandbox host adapters (those are headless surfaces + workbench hosts)

## Related

- Author API (internal plugins): [apps/docs/extension-guide.md](../../apps/docs/extension-guide.md) · hub: [apps/docs/README.md](../../apps/docs/README.md)
- Property **pane** builders and workbench merge: [workbench-and-headless.md](workbench-and-headless.md)
