# Plugin trust boundaries

How **internal** (first-party) and **external** (embed / sandbox) extensions relate to the editor. Companion to [Architecture.md](Architecture.md).

## Vocabulary (three ownership trees)

| Term | Meaning | Not |
| --- | --- | --- |
| **Plugin** / **WorkbenchPlugin** | Trusted first-party in-process OOP module on `PluginManager` | Marketplace / untrusted; external hosts |
| **Embed panel** / **`EmbedPanelHost`** | Declarative `render` / `command` trees from a parent page; mounted via `mountEmbedPanel` | QuickJS / widgets; `PluginManager` |
| **Sandbox extension** / **`SandboxExtensionHost`** | Untrusted QuickJS grant (Worker isolate); mounted via `mountSandboxExtensions` | Internal OOP; `PluginManager` |
| **Sandbox plugin** (`kind: 'plugin'`) | Off-canvas tool extension | Widget; embed panel |
| **Sandbox widget** (`kind: 'widget'`) | On-canvas `openenvx.widget` + isolate | Sandbox plugin |

**Do not share the PluginManager DI tree with external hosts.** Trusted OOP plugins activate with full `WorkbenchPluginContext` (`services`). Sandbox and embed hosts mount on narrow surfaces (`SandboxHostSurface` / `EmbedPanelHostSurface`) that never expose `InstantiationService`. Untrusted isolates / protocol parents never see either surface.

This is **DI isolation**, not registry isolation: sandbox still registers run commands on the shared `CommandService`, and embed panels still register workbench contributions / view panels / icons so the shell palette and sidebars can render them. `SandboxHostSurface` is privileged for the first-party adapter (scene read/write + `executeCommand`) — isolates never receive it; capability gates stay on the host bridge.

Figma parity (plugins vs widgets, isolate + `showUI` iframe) lives on the **sandbox** path only. Embed panels stay a separate, safer/weaker trust path — do not force them onto QuickJS.

## Hard rule

**Untrusted extension code must never execute inside the Studio / editor main world.**

External embed panels interact only through `@xmazu/openenvxee-extensions/protocol`: serializable UI trees + a small `postMessage` (or equivalent) bus. The host validates data, maps it through the same fluent builders internals use, and renders with Studio’s own React.

Sandbox extensions run in a QuickJS Worker isolate and talk through a capability-gated host bridge; optional UI is a sandboxed iframe (`allow-scripts` only).

```mermaid
flowchart LR
  subgraph parent [External process]
    ExtJS["Extension logic runs here"]
    Tree["RenderNode JSON"]
    ExtJS --> Tree
  end
  subgraph host [Studio editor - trusted]
    Validate["validateRenderTree"]
    Mapper["mappers → builders"]
    Render["Studio React / Konva"]
    Gate["allowedCommands + permission"]
    Validate --> Mapper --> Render
    Gate --> Commands["executeCommand"]
  end
  Tree -->|"render"| Validate
  host -->|"context / invoke"| ExtJS
  ExtJS -->|"command"| Gate
```

This is the VS Code webview / Figma widget model: **UI description + message bus**, not `eval`, dynamic `import()`, or loaded scripts in the host bundle. Chrome and contribution lists come from a static `ExtensionManifest` (`openenvx.extension.json`); runtime bodies arrive as validated `render` trees.

## Internal vs external

|  | Internal | External (embed panel) | External (sandbox) |
| --- | --- | --- | --- |
| Runs where | Same JS bundle as the editor | Other document / origin | QuickJS Worker isolate |
| Authors with | OOP `Plugin` + fluent builders | `@xmazu/openenvxee-extensions/panel` → `RenderNode` | JS/TS + widget-sdk / elements / `openenvx.*`; optional `showUI` |
| Trust | First-party | Must not execute arbitrary code in-editor | Must not execute in editor main world |
| Mutation path | Direct `ctx.register` / workbench API | Only `command` through allowlist | Allowlisted `executeCommand` + widget `values` / face render |
| UI path | Builders → descriptors → renderers | Tree → validate → **same** mappers/builders → renderers | Sandboxed iframe (`showUI`) or on-canvas widget face |

Same renderers underneath for embed panels; different trust boundary. Internal plugins stay privileged in-process OOP. Do not force them onto the protocol vocabulary.

## Plugins vs widgets (Figma-shaped)

Sandbox grants use `kind: 'plugin' | 'widget'` with the same product contract as [Figma’s widgets vs plugins](https://developers.figma.com/docs/widgets/widgets-vs-plugins/):

|  | **Sandbox plugin** | **Sandbox widget** |
| --- | --- | --- |
| Mental model | A **tool you run** | An **object on the canvas** |
| Primary UI | Off-canvas floating panel (`showUI` iframe) | On-canvas `openenvx.widget` face; iframe optional |
| Who sees it | Only the user who ran it | Everyone in the file (same layer instance) |
| Lifetime | Starts on user action (`openenvx.sandbox.run.<id>`); one floating UI panel at a time | Lives while matching layers exist; **one isolate per `extensionId`** |
| State | `clientStorage` (per-user, session-local today) | `data.values` on the node (**local until CRDT / multiplayer**) |
| Best for | Automation, import/export, setup | Collaborative / on-canvas interaction |
| Delivery | `artifactUrl` + hash or pushed `source` | Prefer parent `widget:source` from the integrator bundle |

```mermaid
flowchart TB
  subgraph pluginRun [Plugin - user runs tool]
    PIsolate[QuickJS isolate]
    PIframe[showUI iframe]
    PIsolate <-->|"postMessage duplex"| PIframe
    PIsolate -->|"document API"| Scene
  end
  subgraph widgetLive [Widget - node on canvas]
    WNode[openenvx.widget layer]
    WFace[data.children face]
    WIsolate[QuickJS isolate per extensionId]
    WIframe[optional showUI]
    WNode -->|"values / click"| WIsolate
    WIsolate -->|"element tree"| WFace
    WIsolate -.->|"optional"| WIframe
  end
```

### Authoring / React

| Surface | Supported? | Notes |
| --- | --- | --- |
| React (or any framework) in `showUI` iframe | **Yes** | Authors bundle UI into HTML; host never loads it into Studio’s main React tree. Duplex: `openenvx.ui.postMessage` ↔ iframe `postPluginMessage` / `onPluginMessage`. |
| React/Preact via `@xmazu/openenvxee-extensions` + elements | **Yes** | Preact expand inside QuickJS; `renderToElementTree` emits `RenderNode`; host maps to layers. |
| ReactDOM as widget canvas face | **No** | Would put untrusted UI on the editor render path. |
| Backend `renderToElementTree` round-trip | **Yes** | Same package emits element JSON; host applicators map to scene layers. |

**V.1 author promise:** write your panel in React inside `showUI`; talk to the sandbox over `postMessage`. Widget faces are authored with `@xmazu/openenvxee-extensions` + `@xmazu/openenvxee-extensions` and stored as ordinary layers under `data.children`.

## Protocol surface (public for untrusted embed / sandbox code)

Treat `@xmazu/openenvxee-extensions/protocol` as the **only** public wire surface. One lane-neutral message set (postMessage for embed; in-process / Worker bridge for sandbox):

| Direction | Message | Role |
| --- | --- | --- |
| Host → extension | `context` | Selection, permission, theme; optional scene if `contextScope: 'scene'` |
| Host → extension | `invoke` | Handler id (+ args) for clicks / field writes |
| Extension → host | `render` | Surface id + validated `RenderNode` tree (views, inspector panes, widget faces) |
| Extension → host | `command` | Request a host command (allowlisted) |

Static contributions (widgets, blocks, commands, viewContainers, views, chrome trees) live in `ExtensionManifest` / `openenvx.extension.json`. There is **no** runtime `panel:manifest` / `allowManifest` path — chrome is build-time.

Host pieces:

- Transport: `createPostMessagePluginPanelTransport` (origin allowlist required) or sandbox bridge
- Gate: `canRunPluginPanelCommand` / capability ∩ grant (`permission === 'edit'` ∧ `allowedCommands`)
- Validate: `validateRenderTree` / `validatePluginTree` (element whitelist, node/byte caps)
- Map: `createExtensionContributions`, chrome mappers, `mapPluginTreeToPropertyPane`
- Render: Studio React (`PluginPanel` / view containers) or Konva (widget faces)

### What not to expose to third parties

- Loading external JS modules into Studio’s main world
- React `registerViewPanel` / `registerFieldRenderer` / `registerEditorPane` for untrusted code (views arrive as validated panel trees into manifest-declared containers)
- Binding external trees to internal paths (`selection.layer.*`) without a host-owned write policy
- A “trust all origins” transport in production

## Hardening checklist (stability)

The protocol shape is enough as the **interaction model**. Seal these before treating it as a product boundary:

1. **Manifest ∩ grant** — effective caps are the intersection of `ExtensionManifest.permissions` and the host grant; contribute chrome only from the validated static manifest.
2. **Default `contextScope` to `selection`** — product default for embeds; `scene` can exfiltrate the full document to the parent and needs explicit host opt-in.
3. **Semantic allowlists** — command ids via `allowedCommands`; external `render` binds must be `plugin.<surfaceId>.*` (validated + mapped).
4. **Mandatory origin checks** on the transport.
5. **Capability negotiation** — grow beyond `v: 1` with an explicit capabilities list so the surface can evolve without silent breakage.

Demo: Vite serves [apps/canvas-demo/public/embed-parent.html](apps/canvas-demo/public/embed-parent.html) at `/embed-parent.html`; the iframe loads `/?embed=1` with `EmbedPanelHost` via `WorkbenchShell` `mountExternalHosts` (`contextScope: 'selection'`, empty `allowedCommands`). Sandbox demos: canvas-demo seating / save-the-date; html-demo countdown / RSVP.

## QuickJS sandbox (Phase V.1 / V.1.1)

Implemented via `@xmazu/openenvxee-studio` `createSandboxExtensionHost` (workbench `SandboxExtensionHost` + canvas widget click bind), mounted with `mountSandboxExtensions` / `WorkbenchShell` `mountExternalHosts`: **one QuickJS isolate per extension in a dedicated Web Worker** — never silently on the editor UI thread. In-process isolate is test-only (`preferInProcess: true`). Host bridge uses capability + command allowlists; `showUI` is a sandboxed iframe (`allow-scripts` only → opaque origin); `openenvx.widget` nodes carry **local** `data.values` plus a rendered face in `data.children` (collaborative CRDT deferred). Customer widgets push `source` over `widget:source`; first-party grants still use signed URLs + content hashes (minted by openenvx-cloud).

**Plugin lifecycle:** production hosts default `autoStartPlugins: false` — sandbox plugins start via `openenvx.sandbox.run.<id>` (user-run). Demos may opt into auto-start. Closing the floating UI panel does not stop the isolate; **Stop** / `closePlugin` does.

**OK to run:** cloud-minted, hash-pinned, capability-scoped extensions that you (or a customer org admin) explicitly installed for a session.

**Not OK yet:** open marketplace / “anyone uploads JS and it runs in every Studio” — that needs cloud grant/signing, kill switch, version pinning, and further CPU/UI hardening beyond this boundary. Marketplace distribution remains deferred.

### Isolation caps (V.1.1)

| Cap | Value |
| --- | --- |
| Memory | 8 MiB QuickJS soft limit |
| CPU interrupt | 5s wall-clock per sync burst (`setInterruptHandler`) |
| Cumulative CPU | 8s inside a 10s sliding window across host-call resumes (async `await openenvx.*` loops cannot reset forever; each host call charges toward the budget) |
| Worker eval timeout | 15s wall-clock covering sync **and** drained async work → terminate Worker |
| In-flight host calls | 32 per isolate |
| Artifact size | 2 MiB; `https:` only (`http:` localhost/127.0.0.1 for tests); **15s fetch timeout** |
| Concurrent isolates | 8 |
| `showUI` HTML | 512 KiB |
| UI↔isolate message | JSON-serializable, 64 KiB; duplex `openenvx.ui.postMessage` ↔ iframe `postPluginMessage` / `onPluginMessage`; host pushes `ui:context` (theme always; selection only if grant has `document:read`) |
| `notify` / `console` | Rate-limited per extension (`notify` 10/s, `console` 20/s); methods are explicitly allowlisted (null capability = no grant bit required) |
| `clientStorage` | 64 keys **per grant** (not global) |
| Grant ingest | Constructor-only: URL/hash/`uiHtml` size + `normalizeCapabilities` + frozen `allowedCommands` |

**Delivery honesty:** content-hash verification applies to the **`artifactUrl` + `contentHash`** path only. Integrator-pushed `source` / `pushWidgetSource` is trusted to the host that pushed it (no hash). Do not advertise “hash-pinned” for the widget push path.

**Widget isolate granularity:** one QuickJS isolate per `extensionId` (shared by all instances of that widget). Face render + handler invoke are serialized per controller (`widgetOpTail`) so instances cannot interleave async work. Isolate-per-instance is deferred (memory under the concurrent-isolate cap).

**Sandbox plugin lane (decision note):** widget face expand needs QuickJS for deterministic server-side `renderToElementTree`. Sandbox **plugins** already ship UI as `showUI` HTML — the same case where this doc prefers an iframe over a script isolate. Keeping QuickJS for plugins is intentional for a single bridge/`openenvx.*` authoring model in V.1; a future split (iframe-as-isolate for plugins, QuickJS only for widgets) would delete the async-CPU problem class for the plugin lane without changing the protocol messages.

UI iframe messages use `postMessage(..., '*')` because the sandboxed frame has an opaque null origin — the host still checks `event.source === iframe.contentWindow`.

See openenvx-cloud `docs/embed/plugin-api.md`.

## Cloud-hosted / marketplace plugins

If OpenEnvx Cloud hosts plugins “added by people,” **only the other endpoint moves**. Studio’s job stays the same: speak the protocol (embed) or mint sandbox grants.

```mermaid
flowchart TB
  subgraph studio [Studio - trusted]
    Host["PluginPanel + validate + builders + render"]
  end
  subgraph cloud [OpenEnvx Cloud]
    Runner["Plugin runner"]
  end
  Host <-->|"panel:context / tree / event / command"| Runner
```

| Where plugin logic runs | When to use |
| --- | --- |
| Customer parent page | Today’s embed |
| Sandboxed iframe on a plugin origin (e.g. `plugins.openenvx.com/<id>/`) | Plugin is a small web UI — simplest for authors |
| Cloudflare Worker (or similar) | Server-side tree generation from events / config |
| QuickJS / Wasm / V8 isolate | Authors upload **raw JS scripts** that must not get DOM/`fetch` by default |

### Isolates (QuickJS and friends)

Use an isolate when you cannot trust a full browser iframe and people upload scripts. Do **not** embed that isolate in the Studio main world.

Rules if you sandbox JS:

- No DOM, no `fetch` by default, no Studio imports
- Only I/O is the host bridge (and optional sandboxed `showUI` iframe)
- Cap CPU (5s sync interrupt + 8s/10s cumulative window across host calls + 15s Worker eval timeout including async drain), memory (8 MiB), artifact size/timeout, and tree size (tree caps already exist)
- Run in a **Worker** only in production hosts (never `eval` / dynamic `import()` / in-process QuickJS on the editor UI thread). Unit tests may set `preferInProcess: true`.
- Capabilities stay host-side (`allowedCommands`, grant capabilities)

Cloudflare Workers already provide V8 isolates — often enough without shipping QuickJS yourself. QuickJS-in-Wasm is useful when the same tiny sandbox must run in browser _and_ on the server.

Prefer iframe or Worker-without-user-JS first; reach for script isolates only when the authoring model is “upload a script,” not “ship a small app.”

### Marketplace glue (not a new in-editor API)

Install / permissions UI, signed `allowedCommands`, origin allowlists, versioning, kill switch. Avoid: “download plugin bundle and execute inside Studio.”

## Package map

| Concern | Package |
| --- | --- |
| Element vocabulary, messages, `validatePluginTree` / `validateExtensionManifest`, sandbox grant types | `@xmazu/openenvxee-extensions/protocol` (published) |
| Preact element vocabulary (`/canvas` `/html` `/panel`) | `@xmazu/openenvxee-extensions` (published) |
| Widget authoring (`defineExtension`, expand, Vite packaging) | `@xmazu/openenvxee-extensions` (published) |
| Tree → builder mappers, plugin host context, manifest → contributions, `ExternalHostMount`, `SandboxHostSurface` / `EmbedPanelHostSurface`, `mountSandboxHost` / `mountEmbedPanelHost` | `@openenvx/headless` |
| `EmbedPanelHost`, `SandboxExtensionHost`, `PluginPanel`, postMessage transport, command gate, sandbox runtime | `@openenvx/workbench` |
| Internal OOP plugins + builders | `@openenvx/core`, `@openenvx/headless`, product plugins (`canvas-pro`, …) |

## Related

- [Architecture.md](Architecture.md) — package boundaries hub
- [docs/architecture/extensions.md](docs/architecture/extensions.md) — short extensions summary for agents
- [apps/docs/README.md](apps/docs/README.md) — authoring hub (internal vs sandbox vs embed)
- [apps/docs/sandbox-extension-guide.md](apps/docs/sandbox-extension-guide.md) — how to write widgets / sandbox plugins / embed panels
- [apps/docs/extension-guide.md](apps/docs/extension-guide.md) — internal OOP plugins only
- [FEATURES.md](FEATURES.md) — embed panels + sandbox extensions rows
- [PUBLISHING.md](PUBLISHING.md) — protocol publish / link notes
