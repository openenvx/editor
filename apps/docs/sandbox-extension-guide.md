# Sandbox & embed extension guide

How to author **untrusted** extensions: sandbox widgets, sandbox plugins, and embed panels.

This is **not** the internal OOP plugin path. For first-party in-process plugins (`PluginManager`, `WorkbenchPlugin`, canvas layer defs), see [extension-guide.md](extension-guide.md). Start at the hub: [README.md](README.md).

Trust model: [Plugin-boundaries.md](../../Plugin-boundaries.md). Widget pipeline + ownership: [widget-bridge.md](../../docs/architecture/widget-bridge.md).

## Choose widget vs plugin vs embed

|  | Sandbox **widget** | Sandbox **plugin** | **Embed** panel |
| --- | --- | --- | --- |
| Mental model | Object on the canvas / HTML page | Tool the user runs | Parent-page chrome over an iframe host |
| Grant `kind` | `'widget'` | `'plugin'` | N/A — `EmbedPanelHost` |
| Primary UI | On-canvas face (`data.children`) | Off-canvas `showUI` iframe | Declarative `render` trees from parent |
| State | Host `data.values` (isolate expands only) | `clientStorage` / bridge (session) | Parent owns state; host gets `command` / `render` |
| Lifetime | Lives with matching layers; one isolate per `extensionId` | Starts on run command; Stop closes isolate | Mounted while host session lasts |
| Package | `@openenvx/widget-sdk` + `@openenvx/elements` | widget-sdk + optional HTML UI bundle | protocol (+ elements `/panel` + `renderPanelTree`) |

Figma-shaped: widgets = nodes; plugins = tools. Embed is a separate, weaker lane (no QuickJS).

---

## Sandbox widgets (recommended starting point)

### Where state and “rendering” happen

1. **Document state** lives on the host scene layer (`data.values`).
2. **Face expand** (Preact → `RenderNode`) runs in the **QuickJS** isolate when the host calls `renderWidgetFace`.
3. **Bridge** (`openenvx.setSyncedState` / `applyProps`) writes values back to the host; the host re-asks for a face expand.
4. **Paint** is host Konva / HTML on ordinary `data.children` layers — not Preact on the canvas.

`openenvx.*` exists only inside QuickJS (not in the `showUI` iframe, not in the editor main world).

### 1. Define the face

```tsx
/** @jsxImportSource preact */
import { Stack, Text } from '@openenvx/elements/canvas';
import { defineCanvasComponent, string, color } from '@openenvx/widget-sdk';

export const seatingWidget = defineCanvasComponent({
  id: 'wm.seating',
  label: 'Seating plan',
  props: {
    heading: string({ label: 'Heading', default: 'Tables' }),
    accent: color({ label: 'Accent', default: '#b08968' }),
  },
  render({ props, setProps }) {
    return (
      <Stack direction="vertical" padding={16} onClick={() => setProps({})}>
        <Text fill={props.accent} fontSize={24} value={props.heading} />
      </Stack>
    );
  },
});
```

| Surface | API | Element vocabulary |
| --- | --- | --- |
| Canvas (`page.layout: 'absolute'`) | `defineCanvasComponent` | `@openenvx/elements/canvas` |
| HTML (`page.layout: 'html'`) | `defineHtmlComponent` | `@openenvx/elements/html` |

Rules:

- Persistent state = **props** (`data.values`), not Preact `useState` (hooks die with the isolate).
- Prefer `openenvx.widget.useSyncedState` inside isolate code; `setProps` batches patches onto the same host values.
- Face render must stay pure w.r.t. document writes other than values — `executeCommand` / `showUI` throw while `widget.rendering`.
- `onClick` / other `on*` handlers become handler IDs on the host; never pass live functions across the boundary.
- Use `bind="propName"` on face elements when inline edit should write back into `values`.

HTML example: [`apps/html-demo/src/extensions/countdown.widget.tsx`](../html-demo/src/extensions/countdown.widget.tsx).  
Canvas example: [`apps/canvas-demo/src/extensions/seating.widget.tsx`](../canvas-demo/src/extensions/seating.widget.tsx).

### 2. Declare the extension manifest

```tsx
/** @jsxImportSource preact */
import { Toolbar, ToolbarCommand } from '@openenvx/elements/panel';
import { defineExtension, renderPanelTree } from '@openenvx/widget-sdk';
import { seatingWidget } from './seating.widget';

const toolbar = renderPanelTree(
  <Toolbar>
    <ToolbarCommand commandId="wm.seating.insert" label="Seating" />
  </Toolbar>
);

export default defineExtension({
  id: 'wm.seating',
  name: 'Seating',
  permissions: ['widget:render', 'widget:values'],
  // optional: requestedCommands: ['canvas.insertRect'],
  contributes: {
    widgets: [seatingWidget],
    commands: [{ id: 'wm.seating.insert', title: 'Insert seating plan' }],
    chrome: { toolbar: toolbar.tree ?? undefined },
  },
});
```

Use `buildGrantFromManifest({ manifest, session: sessionPolicy, source })` so grant caps/`requestedCommands` intersect the session (delivery `source` / artifact stays host-owned). Omitting `requestedCommands` means no execute allowlist — never inferred from `contributes.commands`.

### 3. Bundle + push source

```ts
import { bundleWidgetSources } from '@openenvx/widget-sdk/vite';
export default { plugins: [bundleWidgetSources()] };

// app — host never runs this; only a string for the isolate
import source from 'openenvx-widget:./seating.widget.tsx';
await sandbox.pushWidgetSource('wm.seating', source);

// Dev HMR: re-push without full reload when the widget file changes
if (import.meta.hot) {
  import.meta.hot.accept('openenvx-widget:./seating.widget.tsx', (mod) => {
    const next = (mod as { default?: string } | undefined)?.default;
    if (next) void sandbox.pushWidgetSource('wm.seating', next);
  });
}
```

After eval, the module must call `openenvx.widget.register` (or `define*Component`, which does). Isolate `console.log` / `warn` / `error` are forwarded to the host console tagged `[sandbox:<id>]` (rate-limited).

### 4. Types

```ts
/// <reference types="@openenvx/widget-sdk/vite/client" />
/// <reference types="@openenvx/widget-sdk/openenvx" />
```

---

## Sandbox plugins

User-run tools (`kind: 'plugin'`). Primary UI is `openenvx.showUI` → sandboxed iframe. Duplex: `openenvx.ui.postMessage` ↔ iframe. Same QuickJS bridge; no face `data.children` requirement.

---

## Embed panels

Parent page sends validated `RenderNode` trees (optionally authored with elements `/panel` + `renderPanelTree`). No QuickJS. See [Plugin-boundaries.md](../../Plugin-boundaries.md).

| Panel authoring helpers | `@openenvx/elements/panel` + `@openenvx/widget-sdk` `renderPanelTree` |

---

## Do / don't

| Do | Don't |
| --- | --- |
| Author faces with widget-sdk + elements | Put untrusted ReactDOM on the canvas |
| Keep document state on the host | Treat QuickJS as the source of truth for values |
| Allowlist commands via grant ∩ manifest | Call arbitrary host commands |
| Use handler ids across the boundary | Pass live functions through the bridge |
