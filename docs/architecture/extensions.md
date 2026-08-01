# Extensions — internal, embed, sandbox

**Audience:** Internal engineers and coding agents. Summary only — full trust model lives in [Plugin-boundaries.md](../../Plugin-boundaries.md).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md) · Widget bridge: [widget-bridge.md](widget-bridge.md).

## Hard rule

**Untrusted extension code must never execute inside the Studio / editor main world.**

## Three ownership trees

| Term | Meaning | Not |
| --- | --- | --- |
| **Plugin** / **WorkbenchPlugin** | Trusted first-party in-process OOP on `PluginManager` | Marketplace / untrusted; external hosts |
| **Embed panel** / `EmbedPanelHost` | Declarative `render` / `command` trees from a parent page; `mountEmbedPanel` | QuickJS / widgets; `PluginManager` |
| **Sandbox extension** / `SandboxExtensionHost` | Untrusted QuickJS grant (Worker isolate); `mountSandboxExtensions` | Internal OOP; `PluginManager` |

Sandbox grants further split:

|  | **Sandbox plugin** (`kind: 'plugin'`) | **Sandbox widget** (`kind: 'widget'`) |
| --- | --- | --- |
| Mental model | Tool you run | Object on the canvas |
| Primary UI | Off-canvas floating `showUI` panel (iframe) | On-canvas face from `@xmazu/openenvxee-elements` (`data.children`) |
| Lifetime | User-run command; Stop closes isolate | Lives with matching layers; **one isolate per `extensionId`** |
| Delivery | `artifactUrl` + `contentHash`, or pushed `source` | Prefer pushed `source` via parent `widget:source` (integrator bundle) |

Widgets declare a face with `defineCanvasComponent` / `defineHtmlComponent` from `@xmazu/openenvxee-elements`. The host asks the isolate to render, maps the tree to ordinary layers (AutoLayout resolved on the host for canvas; HTML uses flex blocks), and stores the result under `data.children` (editable group under the widget in Layers). Values live in `data.values`; the Inspector is derived from the persisted `manifest`. Bound elements (`bind`) commit inline edits back into `values` and re-render. `widget.detach` unlocks the face as a normal group. Export needs no isolate because the face is in the document. Backend templates can call `renderToElementTree()` outside the editor (then map with the host applicator).

## Comparison

|  | Internal | Embed panel | Sandbox |
| --- | --- | --- | --- |
| Runs where | Same JS bundle | Other document / origin | QuickJS Worker isolate |
| Authors with | OOP `Plugin` + builders | `@xmazu/openenvxee-elements` → `RenderNode` | JS/TS + `@xmazu/openenvxee-elements` (`defineExtension`) or `openenvx.*` |
| Mutation | Direct register / workbench API | `command` allowlist | Allowlisted `executeCommand` + widget `values` |
| UI | Builders → descriptors → renderers | Tree → validate → **same** mappers → renderers | Sandboxed iframe or widget face layers |

## Mount path (first-party adapters only)

```text
WorkbenchShell mountExternalHosts
  → workbench EmbedPanelHost / SandboxExtensionHost
  → headless ExternalHostMount
  → EmbedPanelHostSurface / SandboxHostSurface
```

Surfaces never expose `InstantiationService`. Isolates / parent pages never receive surfaces. Studio’s `createSandboxExtensionHost` binds canvas widget clicks without workbench importing canvas.

## Package map

| Concern | Package |
| --- | --- |
| Element vocabulary, messages, `validatePluginTree` / `validateExtensionManifest`, grant types | `@xmazu/openenvxee-protocol` |
| Preact authoring (`defineExtension`, `/canvas` `/html` `/panel`) | `@xmazu/openenvxee-elements` |
| Tree → builder mappers, `ExternalHostMount`, host surfaces | `@openenvx/headless` |
| `EmbedPanelHost`, `SandboxExtensionHost`, transport, gate, runtime | `@xmazu/openenvxee-workbench` |
| Widget click seam + default plugins | `@xmazu/openenvxee-studio` |
| Internal OOP plugins | `core` / `headless` / product plugins |

## Author guides

| Path | Doc |
| --- | --- |
| Pick internal vs sandbox vs embed | [apps/docs/README.md](../../apps/docs/README.md) |
| Internal OOP plugins | [apps/docs/extension-guide.md](../../apps/docs/extension-guide.md) |
| Sandbox widgets / plugins + embed panels | [apps/docs/sandbox-extension-guide.md](../../apps/docs/sandbox-extension-guide.md) |
| Trust, protocol messages, caps, marketplace | [Plugin-boundaries.md](../../Plugin-boundaries.md) |
| Widget face pipeline | [widget-bridge.md](widget-bridge.md) |
| Cloud product API notes | openenvx-cloud `docs/embed/plugin-api.md` (sibling repo) |

## What not to expose to third parties

- Loading external JS into Studio’s main world
- React `registerViewPanel` / `registerFieldRenderer` / `registerEditorPane` for untrusted code (views are manifest-declared containers + validated `render` trees)
- Binding external trees to internal paths without a host-owned write policy
- “Trust all origins” transports in production
