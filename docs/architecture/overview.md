# Overview — how OpenEnvx fits together

**Audience:** Internal engineers and coding agents. Safe base for later external “how OpenEnvx works” docs.

OpenEnvx is a **composable visual editor framework**, not a single monolithic design tool. A scene document is the content source of truth; plugins register layers, commands, and UI; a headless controller owns runtime state; product apps compose a React shell (or bring their own).

Hub: [Architecture.md](../../Architecture.md).

## Mental model

```text
Scene JSON (@xmazu/openenvxee-schema)
        │
        ▼
EditorRuntime + PluginManager (@openenvx/core)
        │
        ├── domain engines: canvas / html / drivers
        │
        ▼
WorkbenchController (@openenvx/headless)
        │
        ▼
WorkbenchShell (@xmazu/openenvxee-workbench)
        │
        ├── canvas studio  (@xmazu/openenvxee-studio)
        └── html studio    (@xmazu/openenvxee-html-studio)
```

| Layer | Job |
| --- | --- |
| **Schema** | Canonical Scene / EditorState / SceneSnapshot |
| **Core** | Plugin host, commands, layers, DI, scene store |
| **Headless** | Workbench runtime: contributions, layout, property host, external host mounts |
| **Domain** | Canvas Konva engine **or** HTML block editor (pick one surface per page via `page.layout`) |
| **Shell** | React chrome that renders contribution descriptors |
| **Product** | Fat bundles that re-export the stack hosts actually import |

## Choose a client tier

| You want… | Use |
| --- | --- |
| Stage only, own state | `schema` + `canvas` (`CanvasStage`) |
| Full editor, custom UI | `core` + `headless` + `canvas` or `html` |
| Full Studio product | `@xmazu/openenvxee-studio` (`DEFAULT_STUDIO_PLUGINS`, `WorkbenchShell`) |
| HTML block product | `@xmazu/openenvxee-html-studio` |
| Untrusted parent panels | `plugin-protocol` + embed host (never main-world JS) |
| Untrusted scripts / widgets | Sandbox QuickJS Worker path (never main-world JS) |

## Two editor surfaces, one workbench

`page.layout` is a provider-defined string. Built-ins:

| `page.layout` | Engine package     | Editor pane                    |
| ------------- | ------------------ | ------------------------------ |
| `'absolute'`  | `@openenvx/canvas` | `CanvasEditor` via canvas host |
| `'html'`      | `@openenvx/html`   | `HtmlEditorPane`               |

Scene-generic chrome (Pages, Layers, dirty status, Inspector container) lives in workbench defaults. Canvas-only chrome (zoom, transform panes, floating toolbar) lives in canvas-pro. HTML owns its Blocks activity sidebar.

## Commands are the mutation hub

Trusted code mutates the scene through **commands** on the shared command service — not ad-hoc store writes from random UI. External paths (embed / sandbox `command` messages, sandbox `executeCommand`) hit the same hub behind allowlists.

## Next chapters

1. [Runtime & core](runtime-and-core.md) — host primitives
2. [Workbench & headless](workbench-and-headless.md) — UI contribution system
3. [Canvas](canvas.md) / [HTML](html.md) — domain engines
4. [Studio & products](studio-and-products.md) — what apps import
5. [Extensions](extensions.md) — trust boundaries summary
