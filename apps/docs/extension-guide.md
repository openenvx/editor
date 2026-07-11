# Canvas extension guide

How to extend the OpenEnvx canvas engine with plugins.

## Contribution kinds

Register canvas contributions from a plugin `activate()` hook:

```ts
import { registerCanvasContribution } from '@openenvx/canvas';

registerCanvasContribution(
  ctx,
  new MyCanvasRendererContribution(),
  new MyLayerPreviewRendererContribution(),
  new MyCanvasInteractionContribution()
);
```

| Contribution | Registry slot | Scope |
| --- | --- | --- |
| `CanvasLayerRendererContribution` | `canvasLayerRenderers` | Per `kind` — Konva node for a layer type |
| `LayerPreviewRendererContribution` | `layerPreviewRenderers` | Per `kind` — DOM preview for a layer type |
| `CanvasLayerInteractionContribution` | `canvasLayerInteractions` | Per `kind` — transformer anchors, edit overlay |

## Stage interaction service (optional)

OSS `@openenvx/canvas` does not include snapping or design-tool overlays. Optional stage behavior is registered as a **service** — no React components in the extension API.

```ts
import {
  CanvasStageInteractionService,
  CanvasStageInteractionServiceId,
} from '@openenvx/canvas';
import { SingletonServiceContribution } from '@openenvx/core';

export class MyStageInteraction extends CanvasStageInteractionService {
  adjustDrag(input) {
    return { x: input.moving.bounds.x, y: input.moving.bounds.y };
  }

  buildOverlays(ctx) {
    return [{ kind: 'line', points: [0, 0, 100, 0] }];
  }

  resetOverlayState() {
    // clear transient guide state between gestures
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

The stage controller resolves the service via `useCanvasStageInteraction()` (full editor apps using `WorkbenchProvider`) or an optional `stageInteraction` prop on `CanvasStage` (standalone embed). Overlays are **primitive arrays** (`line`, `rect`, `label`) painted imperatively with Konva inside canvas.

Reference implementation: `@openenvx/canvas-pro` (`SmartGuidesStageInteraction`).

## Pro package

Install `@openenvx/canvas-pro` and add `CanvasProPlugin` alongside `CanvasBasicsPlugin`:

```ts
plugins: [new CanvasBasicsPlugin(), new CanvasProPlugin()],
```

This registers smart guides, margin snap targets, and align/distribute commands. Page margin **drawing** is handled by OSS canvas when `showMargins` is enabled; pro adds snap-to-margin during drag and resize.
