# Overview - how OpenEnvx fits together

**Audience:** Contributors and integrators who want to understand the editor before choosing a package.

OpenEnvx is a **composable visual editor framework**, not a single monolithic design tool. A scene document is the content source of truth; plugins register layers, commands, and UI; a headless controller owns runtime state; product apps compose a React shell (or bring their own).

Hub: [Architecture.md](../../Architecture.md).

## Mental model

```text
Scene JSON (@openenvx/studio/schema)
        │
        ▼
EditorRuntime + PluginManager + WorkbenchController (@openenvx/studio)
        │
        ├── domain engine: canvas
        │
        ▼
WorkbenchShell (@openenvx/studio/shell)
        │
        └── canvas workbench (@openenvx/canvas-driver)
```

| Layer | Job |
| --- | --- |
| **Schema** | Canonical Scene / EditorState / SceneSnapshot |
| **Core** | Plugin host, commands, layers, DI, scene store, workbench runtime |
| **Domain** | Canvas Konva engine (page surface via `page.layout` and registered editor panes) |
| **Shell** | React chrome that renders contribution descriptors (`@openenvx/studio`) |
| **Product** | Host app wires shell + driver `defaultCanvasWorkbench` (or custom plugins) |

## Choose a client tier

| You want… | Use |
| --- | --- |
| Stage only, own state | `@openenvx/studio/schema` + `@openenvx/canvas-driver` (`CanvasStage`) |
| Full editor, custom UI | `@openenvx/studio` + `@openenvx/studio/shell` + `@openenvx/canvas-driver` |
| Full canvas product | `@openenvx/studio` + `@openenvx/canvas-driver` |
| Untrusted scripts / widgets | Sandbox QuickJS Worker path (never main-world JS) |

## Editor surface and workbench

`page.layout` is a provider-defined string. The built-in canvas product uses `'absolute'` with `CanvasEditor` via the canvas host. Scene-generic chrome (Pages, Layers, dirty status, Inspector container) lives in workbench defaults. Canvas-only chrome (zoom, transform panes, floating toolbar) is registered by `CanvasPlugin`.

## Commands are the mutation hub

Trusted code mutates the scene through **commands** on the shared command service - not ad-hoc store writes from random UI. External paths (embed / sandbox `command` messages, sandbox `executeCommand`) hit the same hub behind allowlists.

## Next chapters

1. [Runtime & core](runtime-and-core.md) - host primitives
2. [Workbench & headless](workbench-and-headless.md) - UI contribution system
3. [Canvas](canvas.md) - domain engine
4. [Studio & products](studio-and-products.md) - what apps import
5. [Extensions](extensions.md) - trust boundaries summary
6. [Packages & public API](packages-and-api.md) - exports and stability
