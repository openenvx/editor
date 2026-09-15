# Overview - how OpenEnvx fits together

**Audience:** Contributors and integrators who want to understand the editor before choosing a package.

OpenEnvx is a **composable visual editor framework**, not a single monolithic design tool. A scene document is the content source of truth; plugins register layers, commands, and UI; a headless controller owns runtime state; product apps compose a React shell (or bring their own).

Hub: [Architecture.md](../../Architecture.md).

## Mental model

```text
Scene JSON (@openenvx/core/schema)
        │
        ▼
EditorRuntime + PluginManager + WorkbenchController (@openenvx/core)
        │
        ├── domain engines: canvas / html / email
        │
        ▼
WorkbenchShell (@openenvx/studio)
        │
        ├── canvas ./studio  (@openenvx/canvas-driver/studio)
        ├── html ./studio    (@openenvx/html-driver/studio)
        └── email ./studio   (@openenvx/email-driver/studio)
```

| Layer | Job |
| --- | --- |
| **Schema** | Canonical Scene / EditorState / SceneSnapshot |
| **Core** | Plugin host, commands, layers, DI, scene store, workbench runtime |
| **Domain** | Canvas Konva engine, HTML block editor, or email driver (pick one surface per page via `page.layout`) |
| **Shell** | React chrome that renders contribution descriptors (`@openenvx/studio`) |
| **Product** | Artboard `./studio` presets that wire shell + engine |

## Choose a client tier

| You want… | Use |
| --- | --- |
| Stage only, own state | `@openenvx/core/schema` + `@openenvx/canvas-driver` (`CanvasStage`) |
| Full editor, custom UI | `@openenvx/core` + `@openenvx/studio` + `canvas` / `html` / `email` |
| Full canvas product | `@openenvx/studio` + `@openenvx/canvas-driver/studio` |
| HTML block product | `@openenvx/studio` + `@openenvx/html-driver/studio` |
| Email block editor | `@openenvx/studio` + `@openenvx/email-driver/studio` |
| Untrusted scripts / widgets | Sandbox QuickJS Worker path (never main-world JS) |

## Two editor surfaces, one workbench

`page.layout` is a provider-defined string. Built-ins:

| `page.layout` | Engine package            | Editor pane                    |
| ------------- | ------------------------- | ------------------------------ |
| `'absolute'`  | `@openenvx/canvas-driver` | `CanvasEditor` via canvas host |
| `'html'`      | `@openenvx/html-driver`   | `HtmlEditorPane`               |
| `'email'`     | `@openenvx/email-driver`  | `EmailEditorPane`              |

Scene-generic chrome (Pages, Layers, dirty status, Inspector container) lives in workbench defaults. Canvas-only chrome (zoom, transform panes, floating toolbar) is registered by `CanvasPlugin`. HTML and email each own a Blocks activity sidebar.

## Commands are the mutation hub

Trusted code mutates the scene through **commands** on the shared command service - not ad-hoc store writes from random UI. External paths (embed / sandbox `command` messages, sandbox `executeCommand`) hit the same hub behind allowlists.

## Next chapters

1. [Runtime & core](runtime-and-core.md) - host primitives
2. [Workbench & headless](workbench-and-headless.md) - UI contribution system
3. [Canvas](canvas.md) / [HTML](html.md) / [Email driver](email-driver.md) - domain engines
4. [Studio & products](studio-and-products.md) - what apps import
5. [Extensions](extensions.md) - trust boundaries summary
6. [Packages & public API](packages-and-api.md) - exports and stability
