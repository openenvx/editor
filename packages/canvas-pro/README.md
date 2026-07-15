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

Omit `CanvasPagesPlugin` from the list to hide the Pages sidebar section.

**Replace the Pages tree** — register your own `ViewTreeProviderContribution` with `readonly primary = true` after `CanvasPagesPlugin` activates. See [extension guide](../../apps/docs/extension-guide.md).

## Extension model

Pro registers `SmartGuidesStageInteraction` via `CanvasStageInteractionServiceId`. The service implements OSS `CanvasStageInteractionService` and returns overlay primitives — no React components. See [extension guide](../../apps/docs/extension-guide.md).

## License

UNLICENSED — not published in the public `publish-packages` script.
