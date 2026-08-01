# Canvas

**Audience:** Internal engineers and coding agents. Package: `@openenvx/canvas` (+ chrome in `@openenvx/canvas-pro`).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Hard rule

**All canvas rendering and interactions live in `@openenvx/canvas`.** Never add canvas implementations to `core`.

## What canvas owns

- Konva stage, viewport, geometry, rich-text layout and resize
- `CanvasEditor`, `CanvasHostProvider`, TipTap overlay
- Canvas layer definitions, clipboard, canvas commands (`canvas.exportImage`, `canvas.setPagePreset`, …)
- Canvas renderer / preview / interaction contributions and `Canvas*ServiceId` tokens
- `CanvasRegistriesReader`, `PageResizeService`
- `useCanvasRegistries()`, `useCanvasApi()` — require `CanvasHostProvider`
- `CanvasBasicsPlugin` — layers, renderers, interactions, commands only (**no** workbench chrome)
- `registerCanvasContribution()` for third-party renderers, interactions, layer preview renderers
- `CanvasStageInteractionService` — optional stage drag/resize adjustment + overlay primitives
- Page size presets and `AbsolutePageRules` (`layout: 'absolute'`)

### Enterprise / override hooks

- Per-kind override of OSS renderers / interactions / preview / SVG export (server) via `{ override: true }`
- Generic layer handles on `CanvasLayerInteractionContribution` (`providesHandles`, `layoutHandles`, `onHandleDrag*`)
- Optional `dataPatch` on `canvas.updateLayerTransform` (merges into `layer.data`)

## CanvasBasics vs canvas-pro

| Package | Responsibility |
| --- | --- |
| `@openenvx/canvas` | Engine: layers, commands, Konva, `CanvasEditor` |
| `@openenvx/canvas-pro` | Canvas-only workbench chrome: zoom/selection status, transform property panes, insert-tool toolbar, grid/rulers, floating toolbar layout defaults |

Scene-generic chrome (Pages/Layers, dirty status) is workbench default — not canvas-pro.

## Wiring in a workbench app

App shell (or studio) provides:

1. `WorkbenchProvider` / `WorkbenchShell`
2. `CanvasHostProvider` around the editor region
3. Editor pane that mounts `CanvasEditor` for `page.layout === 'absolute'`
4. Plugins: at least `CanvasBasicsPlugin`; product hosts also load `CanvasProPlugin` (+ drivers, agent, …)

See `apps/canvas-demo` / `apps/demo-playground` and [studio-and-products.md](studio-and-products.md).

## Widgets

`openenvx.widget` layers are canvas layer types. Click binding and isolate lifecycle are owned by the **sandbox** path (`createSandboxExtensionHost` in studio wires canvas click handler + layer type so workbench never imports canvas). Trust model: [extensions.md](extensions.md).

## What does **not** belong in canvas

- Generic workbench chrome (Pages/Layers)
- Headless contribution base classes (those stay in headless)
- Embed protocol vocabulary (plugin-protocol)
- HTML block editing (`@openenvx/html`)

## Related

- Package README: [packages/canvas/README.md](../../packages/canvas/README.md)
- Author extension (internal): [apps/docs/extension-guide.md](../../apps/docs/extension-guide.md) · hub: [apps/docs/README.md](../../apps/docs/README.md)
- Pro chrome README: [packages/canvas-pro/README.md](../../packages/canvas-pro/README.md)
