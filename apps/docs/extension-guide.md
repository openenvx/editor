# Canvas extension guide

How to extend the OpenEnvx canvas engine with plugins.

## OSS vs enterprise shell

| Package | Responsibility |
| --- | --- |
| `@openenvx/canvas` | Canvas engine: layers, commands, Konva renderers, `CanvasEditor` |
| `@openenvx/headless` | Workbench runtime: `WorkbenchController`, `WorkbenchPlugin`, `registerWorkbench()` |
| Your app / `demo-playground` | Wire canvas to workbench via `CanvasHostProvider` + app-owned toolbar/sidebars |
| `@openenvx/canvas-pro` (enterprise) | Pre-built canvas workbench chrome: toolbar, palette, layers sidebar, editor pane registration |

`CanvasBasicsPlugin` registers engine contributions only. For a full editor UX, either wire chrome in your app shell (see `apps/demo-playground`) or use enterprise `@openenvx/canvas-pro`.

### Wiring canvas in a workbench app

`@openenvx/canvas` does not depend on `@openenvx/headless`. The app bridges them:

```tsx
import { CanvasHostProvider, CanvasEditor } from '@openenvx/canvas';
import { useWorkbenchContext } from '@openenvx/headless/react';

// Provide CanvasHostApi from workbench, then mount CanvasEditor.
// See apps/demo-playground/src/components/absolute-editor-pane.tsx
```

Workbench UI contributions use `WorkbenchPlugin` and `ctx.registerWorkbench()`:

```ts
import { WorkbenchPlugin } from '@openenvx/headless';

class MyWorkbenchPlugin extends WorkbenchPlugin {
  readonly id = 'my.workbench';

  activateWorkbench(ctx) {
    ctx.registerWorkbench(new MyToolbarContribution());
  }
}
```

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
  type CanvasStageInteractionService,
  CanvasStageInteractionServiceId,
} from '@openenvx/canvas';
import { SingletonServiceContribution } from '@openenvx/core';

export class MyStageInteraction implements CanvasStageInteractionService {
  adjustDrag(input) {
    return {
      overlays: [],
      x: input.moving.bounds.x,
      y: input.moving.bounds.y,
    };
  }

  buildOverlays(_ctx) {
    return [{ kind: 'line', points: [0, 0, 100, 0] }];
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

The stage controller resolves the service via `useCanvasStageInteraction()` inside a `CanvasHostProvider`, or an optional `stageInteraction` prop on `CanvasStage` (standalone embed). `adjustDrag` and `adjustResize` return adjusted coordinates plus transient `overlays` primitives; `buildOverlays` is for static overlays only. Overlays are **primitive arrays** (`line`, `rect`, `label`) painted imperatively with Konva inside canvas.
