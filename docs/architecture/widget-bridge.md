# Widget bridge — outside world to canvas / HTML

**Audience:** Integrators and coding agents. How a developer-authored Preact component becomes pixels (or HTML) inside the hosted editor.

Related: [extensions.md](extensions.md), [Plugin-boundaries.md](../../Plugin-boundaries.md).

## Pipeline

```mermaid
flowchart LR
  subgraph outside [Integrator app]
    SRC["seating.widget.tsx"]
    VITE["Vite: openenvxWidgets + openenvx-widget: import"]
    STR["IIFE source string"]
  end
  subgraph host [Editor iframe]
    subgraph worker [QuickJS Worker - one isolate per extensionId]
      DEF["defineCanvasComponent"]
      PREACT["Preact expand"]
      HANDLERS["handler registry: h1, h2, ..."]
    end
    TREE["render tree JSON"]
    MAP["mapper + layout resolver"]
    SCENE["scene layers in data.children"]
    PAINT["Konva canvas / React HTML"]
  end
  SRC --> VITE --> STR -->|"pushWidgetSource"| DEF
  DEF --> PREACT --> TREE --> MAP --> SCENE --> PAINT
  PREACT -.->|"function props"| HANDLERS
```

Authoring lives in `@xmazu/openenvxee-elements` (`defineCanvasComponent` / `defineHtmlComponent` / `defineExtension`, prop helpers, canvas/HTML/panel component sets). Demo apps use the Vite plugin `openenvxWidgets()` and import widgets as `openenvx-widget:./foo.widget.tsx` — that returns an IIFE **string** (Preact + elements bundled) which is pushed into the isolate. The host React app never executes the widget; the isolate never sees a browser DOM.

The host maps that tree to ordinary scene layers via `applyWidgetFace` (unwraps a root `canvas.group` into `data.children`, syncs widget width/height to the laid-out face, persists `data.handlers`). Face children are ordinary editable layers under the widget in Layers. Export flattens `children` generically — no isolate on the server.

## Events (handler IDs)

Functions never cross the sandbox boundary.

```mermaid
sequenceDiagram
  participant User
  participant Canvas as Host canvas
  participant Host as SandboxExtensionHost
  participant Iso as QuickJS isolate
  participant Scene as Scene store
  User->>Canvas: click face child
  Canvas->>Host: emitOpenEnvxWidgetClick(targetId)
  Host->>Host: look up data.handlers[targetId].click
  Host->>Iso: invoke handler bag for layerId (h1)
  Iso->>Iso: run handler, call setProps(patch)
  Iso->>Host: bridge setSyncedState
  Host->>Scene: apply values
  Scene->>Host: scene change
  Host->>Iso: re-render with new props
  Iso->>Host: new render tree
  Host->>Canvas: new face layers
```

During render, any `on*` function prop is replaced with an id (`h1`, `h2`, …) and stored in `__openenvxWidgetHandlers`. The face mapper persists `data.handlers` on the widget layer so the host can resolve clicks without holding live function references.

## Props write-back

Persistent state is document props (`data.values`), not Preact `useState`.

```mermaid
flowchart TB
  Inspector["Inspector fields from manifest"] -->|"updateProperty values.x"| Values["data.values"]
  Bind["Bound face edit / setProps"] --> Values
  Values -->|"scene change"| Refresh["renderWidgetFace"]
  Refresh --> Face["data.children + data.handlers"]
```

`defineCanvasComponent({ props: { title: string() }, render })` compiles the schema into `manifest.fields` + `defaults` for the Inspector. Ephemeral Preact hooks die with the isolate.

## Three vocabularies, one envelope

| Subpath | Vocabulary | Maps to |
| --- | --- | --- |
| `@xmazu/openenvxee-elements/canvas` | `Stack`, `Row`, `Grid`, `Rect`, `Text`, … | canvas layers |
| `@xmazu/openenvxee-elements/html` | `Section`, `Row`, `Column`, `Heading`, … | html.* blocks |
| `@xmazu/openenvxee-elements/panel` | `Pane`, `Menu`, `Toolbar`, … | workbench chrome / inspector |

All emit the same `{ type, props, children }` envelope (`RenderNode` in `@xmazu/openenvxee-protocol`). The protocol package is the wire contract and validator; Preact is the only authoring runtime.

## Interim vs future

Today `@xmazu/openenvxee-protocol` owns the wire contract: `RenderNode`, `ExtensionManifest`, unified messages (`render` / `invoke` / `context` / `command`), validators, and sandbox grants. Authoring lives in `@xmazu/openenvxee-elements` (`defineExtension`, `defineCanvasComponent`, `/canvas` `/html` `/panel`).

**Roadmap:** eventually fold the remaining wire contract into schema / a thinner surface if cloud consumers stop importing the protocol package by name. Tracked on the platform roadmap (M4 / SDK polish).
