# OpenEnvx Architecture

Package boundaries and contribution flow for the monorepo.

**Audience:** Internal engineers and coding agents. Structure is meant to peel into external docs later without a rewrite.

**Also read:** [Plugin-boundaries.md](Plugin-boundaries.md) — internal vs external plugins, protocol trust boundary, and cloud/marketplace runners. Do not load untrusted plugin JS into the editor main world.

## Deep chapters

| Chapter | Use when |
| --- | --- |
| [Overview](docs/architecture/overview.md) | Mental model, client tiers, how pieces connect |
| [Runtime & core](docs/architecture/runtime-and-core.md) | `EditorRuntime`, `PluginManager`, scene, commands, DI |
| [Workbench & headless](docs/architecture/workbench-and-headless.md) | Controller, UI contributions, layout, property panes |
| [Property fields](docs/architecture/property-fields.md) | Inspector field descriptors, kinds, `layout`, `when` |
| [Canvas](docs/architecture/canvas.md) | Canvas engine, `CanvasPlugin`, workbench chrome |
| [HTML](docs/architecture/html.md) | Block editor, slots, `HtmlBlocksPlugin` |
| [HTML editor surfaces](docs/architecture/html-editor-surfaces.md) | Stage / artboard / page-root naming + click selection |
| [Email driver](docs/architecture/driver-email.md) | React-Email block editor, `EmailBlocksPlugin`, `renderEmailDocument` |
| [Studio & products](docs/architecture/studio-and-products.md) | Fat bundles, what host apps import |
| [Extensions](docs/architecture/extensions.md) | Internal vs sandbox (summary + links) |
| [Packages & public API](docs/architecture/packages-and-api.md) | Package map, export surface, pre-1.0 stability |

Author how-to (under `docs/architecture/`):

- [extensions.md](docs/architecture/extensions.md) — lanes overview
- [extensions-sandbox-guide.md](docs/architecture/extensions-sandbox-guide.md) — sandbox widgets / plugins
- [extensions-host-guide.md](docs/architecture/extensions-host-guide.md) — internal OOP plugins
- [roadmap.md](docs/architecture/roadmap.md) — enterprise host API roadmap

## Client tiers (monorepo)

| Tier | Packages | Who |
| --- | --- | --- |
| **Rendering-only** | `schema`, `canvas` | Embed `CanvasStage` in a custom React app with own state. No plugin host. |
| **Editor backbone** | `core`, optional `canvas` / `html`, `driver-*`, plugins | Full editor runtime (scene, commands, layers, workbench controller) with a **custom UI shell**. See `apps/demo-playground` / `apps/html-demo`. |
| **Workbench UI** | `workbench` | React shell (`WorkbenchShell`); workspace-private. |
| **Published product** | `studio`, `extensions`, `schema`, `preview` | Fat bundle + sandbox author SDK |
| **HTML studio** | `html`, `html-studio`, `openenvxee-html-studio`, optional `driver-*` | Puck-style block editor + thin studio re-exports + published fat bundle; product hosts own their blocks/plugins |

**Hard rules:** All canvas code lives in `@openenvx/canvas` (not `core`). HTML block editing lives in `@openenvx/html`. Email block editing lives in `@openenvx/driver-email`. Untrusted extension code never runs in the editor main world.

## Package tiers

| Tier | Packages | License / publish (intent) | Responsibility |
| --- | --- | --- | --- |
| Foundation | `schema`, `preview`, `core` | Private (workspace); `schema` also published | Scene model (Zod + JSON Schema), plugin host primitives |
| Embed / sandbox protocol | `extensions` (`@xmazu/openenvxee-extensions`, `./protocol` subpath) | Published (public) | `RenderNode`, manifests, validators, sandbox grants |
| Product libs | `canvas`, `html`, `driver-email`, `workbench`, `agent`, `canvas-studio`, `html-studio` | Private (workspace) | Canvas editor, HTML editor, email driver, React shell, agent, studio host surfaces |
| Published product | `studio` | Proprietary; published | Fat bundle inlining workbench + canvas + agent |

## Placement cheat sheet

| Put it here | Examples |
| --- | --- |
| `@xmazu/openenvxee-schema` | Scene Zod schemas, `validateScene` / `normalizeScene`, JSON Schema export |
| `@openenvx/core` | `Command`, `LayerDefinition`, `Plugin`, `EditorRuntime`, `PluginManager`, scene store, `PropertyBuilder`, `Registry`, `WorkbenchController`, `WorkbenchPlugin`, UI contributions, property host context, external host mount surfaces |
| `@openenvx/canvas` | Konva stage, layers, renderers, `CanvasPlugin`, `CanvasEditor` |
| `@openenvx/html` | Block configs, `HtmlBlocksPlugin`, `HtmlEditorPane` |
| `@openenvx/driver-email` | Email blocks, `EmailBlocksPlugin`, `EmailEditorPane`, `renderEmailDocument` |
| `@openenvx/workbench` | `WorkbenchShell`, field renderers, sandbox/embed hosts |
| `@openenvx/canvas-studio` | Curated canvas host API (workspace TS) + `DEFAULT_STUDIO_PLUGINS` + `createSandboxExtensionHost` |
| `@xmazu/openenvxee-studio` | Published fat bundle of canvas-studio |
| `@openenvx/html-studio` | HTML product re-exports + `DEFAULT_HTML_STUDIO_PLUGINS` |
| `@xmazu/openenvxee-html-studio` | Published HTML host (re-exports html-studio; per-module `dist/` + `./runtime`) |
| `@xmazu/openenvxee-extensions` | Sandbox author SDK (`./protocol`, `/canvas`, `/html`, `/panel`, Vite) |

## Contribution flow (sketch)

```mermaid
flowchart TB
  subgraph plugins [Plugins]
    Chrome[DefaultWorkbenchChromePlugin]
    CanvasPlugin[CanvasPlugin]
    HtmlBlocks[HtmlBlocksPlugin]
    Custom[CustomPlugin]
  end
  subgraph canvasPkg [canvas]
    Registries[CanvasRegistriesService]
  end
  subgraph coreHost [core]
    Runtime[EditorRuntime]
    PluginHost[PluginManager]
    WbRegs[WorkbenchRegistries]
    Controller[WorkbenchController]
  end
  subgraph app [studio / demos]
    Shell[WorkbenchShell]
  end
  Chrome -->|pages layers status| WbRegs
  CanvasPlugin -->|commands layers chrome| PluginHost
  CanvasPlugin -->|registerCanvasContribution| Registries
  CanvasPlugin -->|canvas chrome| WbRegs
  HtmlBlocks -->|layers editorPane| PluginHost
  HtmlBlocks -->|registerEditorPane html| WbRegs
  Shell --> Controller
  Controller --> Runtime
```

1. `WorkbenchShell` injects default chrome (Pages/Layers + dirty status) plus Inspector / field plugins.
2. Domain plugins (`CanvasPlugin`, `HtmlBlocksPlugin`, …) register via core + domain registries and workbench contributions.
3. `WorkbenchController` (in `@openenvx/core`) assembles core + workbench registries into `WorkbenchState`.

External hosts (sandbox / embed) mount **off** `PluginManager` via `ExternalHostMount` — see [Extensions](docs/architecture/extensions.md) and [Plugin-boundaries.md](Plugin-boundaries.md).

## Code style — OOP vs functional

| Layer | Style | Examples |
| --- | --- | --- |
| `core`, `canvas`, plugins | **OOP** — abstract classes, builders, visitors | `Plugin`, `Command`, `LayerDefinition`, `PropertyPaneBuilder` |
| App / shell React UI | **Functional only** — function components and hooks | `WorkbenchShell`, field renderers |

Plugin API surface = classes extending contribution base classes, not plain config objects.

## Related

- [Packages & public API](docs/architecture/packages-and-api.md) — exports, who imports what, stability
- [FEATURES.md](FEATURES.md) — product capability matrix
- [PUBLISHING.md](PUBLISHING.md) — what ships to the registry
- [AGENTS.md](AGENTS.md) — agent workflow and placement rules
