# @openenvx/canvas-pro

Closed-source pro design tools for the OpenEnvx canvas.

## Features

- Smart guides (axis alignment + equal spacing snap)
- Page margin overlay
- Align commands: `canvas.alignLeft`, `canvas.alignCenter`, `canvas.alignRight`, `canvas.alignTop`, `canvas.alignMiddle`, `canvas.alignBottom`
- Distribute command: `canvas.distributeHorizontal`

## Usage

```ts
import { CanvasBasicsPlugin } from '@openenvx/canvas';
import { DEFAULT_CANVAS_PRO_PLUGINS } from '@openenvx/canvas-pro';

plugins: [new CanvasBasicsPlugin(), ...DEFAULT_CANVAS_PRO_PLUGINS],
```

Omit the default chrome plugin or replace tree providers to customize Pages/Layers. Pages/Layers live in `@xmazu/openenvxee-workbench` (`DefaultWorkbenchChromePlugin`, auto-injected by `WorkbenchShell`).

**Replace the Pages tree** — register your own provider with `readonly primary = true` for `workbench.pages`. See [extension guide](../../apps/docs/extension-guide.md).

## Extension model

Pro registers `SmartGuidesStageInteraction` via `CanvasStageInteractionServiceId`. The service implements OSS `CanvasStageInteractionService` and returns overlay primitives — no React components. See [extension guide](../../apps/docs/extension-guide.md).

## License

UNLICENSED — not published in the public `publish-packages` script.
