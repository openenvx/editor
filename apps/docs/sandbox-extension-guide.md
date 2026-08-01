# Sandbox & embed extension guide

How to author **untrusted** extensions: sandbox widgets, sandbox plugins, and embed panels.

This is **not** the internal OOP plugin path. For first-party in-process plugins (`PluginManager`, `WorkbenchPlugin`, canvas layer defs), see [extension-guide.md](extension-guide.md). Start at the hub: [README.md](README.md).

Trust model: [Plugin-boundaries.md](../../Plugin-boundaries.md). Widget pipeline: [widget-bridge.md](../../docs/architecture/widget-bridge.md).

## Choose widget vs plugin vs embed

|  | Sandbox **widget** | Sandbox **plugin** | **Embed** panel |
| --- | --- | --- | --- |
| Mental model | Object on the canvas / HTML page | Tool the user runs | Parent-page chrome over an iframe host |
| Grant `kind` | `'widget'` | `'plugin'` | N/A — `EmbedPanelHost` |
| Primary UI | On-canvas face (`data.children`) from elements | Off-canvas `showUI` iframe | Declarative `render` trees from parent |
| State | `data.values` on the widget layer | `clientStorage` / bridge (session) | Parent owns state; host gets `command` / `render` |
| Lifetime | Lives with matching layers; one isolate per `extensionId` | Starts on run command; Stop closes isolate | Mounted while host session lasts |
| Package | `@xmazu/openenvxee-elements` | elements + optional HTML UI bundle | `@xmazu/openenvxee-protocol` (+ `/panel` helpers) |

Figma-shaped: widgets = nodes; plugins = tools. Embed is a separate, weaker lane (no QuickJS).

---

## Sandbox widgets (recommended starting point)

### 1. Define the face

```tsx
/** @jsxImportSource preact */
import {
  defineCanvasComponent,
  Stack,
  Text,
  string,
  color,
} from '@xmazu/openenvxee-elements';

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
| Canvas (`page.layout: 'absolute'`) | `defineCanvasComponent` | `@xmazu/openenvxee-elements` / `/canvas` — `Stack`, `Grid`, `Text`, … |
| HTML (`page.layout: 'html'`) | `defineHtmlComponent` | `/html` — `Section`, `Heading`, `Paragraph`, … |

Rules:

- Persistent state = **props** (`data.values`), not Preact `useState` (hooks die with the isolate).
- `props` schema → Inspector fields via `manifest.fields` / `defaults`.
- `onClick` / other `on*` handlers become handler IDs on the host; never pass live functions across the boundary.
- Use `bind="propName"` on face elements when inline edit should write back into `values`.

HTML example: [`apps/html-demo/src/extensions/countdown.widget.tsx`](../html-demo/src/extensions/countdown.widget.tsx).  
Canvas example: [`apps/canvas-demo/src/extensions/seating.widget.tsx`](../canvas-demo/src/extensions/seating.widget.tsx).

### 2. Declare the extension manifest

```tsx
/** @jsxImportSource preact */
import { defineExtension } from '@xmazu/openenvxee-elements';
import {
  renderPanelTree,
  Toolbar,
  ToolbarCommand,
} from '@xmazu/openenvxee-elements/panel';
import { seatingWidget } from './seating.widget';

const toolbar = renderPanelTree(
  <Toolbar>
    <ToolbarCommand commandId="wm.seating.insert" label="Seating" />
  </Toolbar>
);

export default defineExtension({
  id: 'wm.seating',
  name: 'Seating',
  activation: ['onWidget:wm.seating', 'onCommand:wm.seating.insert'],
  permissions: ['widget:render', 'widget:values'],
  contributes: {
    widgets: [seatingWidget], // HTML: use `blocks: [...]` instead
    commands: [{ id: 'wm.seating.insert', title: 'Insert seating plan' }],
    chrome: { toolbar: toolbar.tree ?? undefined },
  },
});
```

`defineExtension` returns a serializable `ExtensionManifest` (static chrome — no runtime `panel:manifest`).

### 3. Bundle source for the isolate (Vite)

Widget **source** is an IIFE string. The host React app never executes it.

```ts
// vite.config.ts
import { openenvxWidgets } from '@xmazu/openenvxee-elements/vite';
export default { plugins: [openenvxWidgets()] };

// app
import source from 'openenvx-widget:./extensions/seating.widget.tsx';
await sandbox.pushWidgetSource('wm.seating', source);
```

See [`packages/elements/README.md`](../../packages/elements/README.md).

### 4. Mount on the host

```ts
import {
  createSandboxExtensionHost,
  mountSandboxExtensions,
  WorkbenchShell,
} from '@xmazu/openenvxee-studio';
import seatingManifest from './extensions/seating.extension';
import seatingSource from 'openenvx-widget:./extensions/seating.widget.tsx';

const sandbox = createSandboxExtensionHost({
  permission: 'edit',
  manifests: [seatingManifest],
  grants: [
    {
      id: 'wm.seating',
      kind: 'widget',
      source: seatingSource,
      capabilities: ['widget:render', 'widget:values'],
      allowedCommands: ['wm.seating.insert'],
      title: 'Seating',
    },
  ],
});

// WorkbenchShell mountExternalHosts:
mountSandboxExtensions(api, sandbox);
void sandbox.pushWidgetSource('wm.seating', seatingSource);
```

Full wiring: [`apps/canvas-demo/src/app.tsx`](../canvas-demo/src/app.tsx), [`apps/html-demo/src/app.tsx`](../html-demo/src/app.tsx).

### What the host does with your face

1. Isolate expands Preact → element JSON (`RenderNode`).
2. Host maps to ordinary layers (`applyWidgetFace` / `applyHtmlWidgetFace`) under `data.children`.
3. Inspector edits `data.values` → re-render.
4. Export uses `children` — **no isolate on the server**.
5. Backend templates can call `renderToElementTree()` from `@xmazu/openenvxee-elements` outside the editor.

---

## Sandbox plugins (`kind: 'plugin'`)

Off-canvas tools (import/export, setup wizards). Same isolate host; different UX.

| Piece | Notes |
| --- | --- |
| Grant | `{ kind: 'plugin', id, artifactUrl + contentHash \| source, capabilities, allowedCommands, uiHtml? }` |
| Start | Production: user runs `openenvx.sandbox.run.<id>` (`autoStartPlugins: false`). Demos may auto-start. |
| UI | `openenvx.showUI(html, { width, height })` → sandboxed iframe (`allow-scripts` only). Bundle **any** UI framework inside that HTML; Studio never mounts it in main React. |
| Duplex | Isolate `openenvx.ui.postMessage` ↔ iframe `postPluginMessage` / `onPluginMessage`. |
| Stop | Closing the floating panel does **not** stop the isolate; **Stop** / `closePlugin` does. |
| Mutation | Only allowlisted `executeCommand` + granted capabilities — never `PluginManager` / DI. |

Widgets may also open optional `showUI` when `ui:show` is granted; the face on canvas remains the primary UI.

There is no first-class “plugin.tsx” demo in-repo yet — follow Plugin-boundaries + the seating host pattern with `kind: 'plugin'` and `uiHtml` / `showUI`. Caps and limits: [Plugin-boundaries.md](../../Plugin-boundaries.md) (QuickJS sandbox section).

---

## Embed panels

Parent page drives declarative UI over `postMessage`. **No** QuickJS, **no** widget face.

| Piece | Package / API |
| --- | --- |
| Wire types + validators | `@xmazu/openenvxee-protocol` — `RenderNode`, `validateRenderTree`, message unions |
| Panel authoring helpers | `@xmazu/openenvxee-elements/panel` → trees the parent can `render` |
| Host | `EmbedPanelHost` + `createPostMessagePluginPanelTransport` + `mountEmbedPanel` (via studio) |

Messages (lane-neutral):

| Direction | Message | Role |
| --- | --- | --- |
| Host → parent | `context` | Selection / theme (default `contextScope: 'selection'`) |
| Host → parent | `invoke` | Handler id |
| Parent → host | `render` | Validated tree for a surface |
| Parent → host | `command` | Allowlisted host command |

Host rules:

- Origin allowlist on the transport (never “trust all” in production).
- `allowedCommands` gate every `command`.
- Do **not** load parent JS into Studio.

Demo parent page: [`apps/canvas-demo/public/embed-parent.html`](../canvas-demo/public/embed-parent.html) (served as `/embed-parent.html`; iframe `/?embed=1`).

Product cloud notes (sibling repo): openenvx-cloud `docs/embed/plugin-api.md`.

---

## Do / don’t

| Do | Don’t |
| --- | --- |
| Author faces with `@xmazu/openenvxee-elements` | Put untrusted ReactDOM on the canvas |
| Push IIFE source into the isolate | `import()` customer code into `PluginManager` |
| Declare chrome in `defineExtension` / manifest | Expect runtime `panel:manifest` from untrusted code |
| Use `registerViewPanel` only in **internal** plugins for non-form surfaces | Expose `ViewPane` / `PropertyContentRenderer` to embeds |
| Keep scene mutation on allowlisted commands / `values` | Write the scene store from extension UI ad hoc |

---

## Related

| Doc | Role |
| --- | --- |
| [README.md](README.md) | Path picker |
| [extension-guide.md](extension-guide.md) | Internal OOP plugins only |
| [Plugin-boundaries.md](../../Plugin-boundaries.md) | Trust, caps, protocol surface |
| [widget-bridge.md](../../docs/architecture/widget-bridge.md) | Face render / handler-ID pipeline |
| [packages/elements/README.md](../../packages/elements/README.md) | SDK quickstart |
| [packages-and-api.md](../../docs/architecture/packages-and-api.md) | Package exports |
