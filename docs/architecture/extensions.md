# Extensions — internal, embed, sandbox

**Audience:** Internal engineers and coding agents. Summary only — full trust model lives in [Plugin-boundaries.md](../../Plugin-boundaries.md).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Hard rule

**Untrusted extension code must never execute inside the Studio / editor main world.**

## Three ownership trees

| Term | Meaning | Not |
| --- | --- | --- |
| **Plugin** / **WorkbenchPlugin** | Trusted first-party in-process OOP on `PluginManager` | Marketplace / untrusted; external hosts |
| **Embed panel** / `EmbedPanelHost` | Declarative `panel:*` trees from a parent page; `mountEmbedPanel` | QuickJS / widgets; `PluginManager` |
| **Sandbox extension** / `SandboxExtensionHost` | Untrusted QuickJS grant (Worker isolate); `mountSandboxExtensions` | Internal OOP; `PluginManager` |

Sandbox grants further split:

|  | **Sandbox plugin** (`kind: 'plugin'`) | **Sandbox widget** (`kind: 'widget'`) |
| --- | --- | --- |
| Mental model | Tool you run | Object on the canvas |
| Primary UI | Off-canvas floating `showUI` panel (iframe) | On-canvas `openenvx.widget` face |
| Lifetime | User-run command; Stop closes isolate | Lives with the layer; one isolate per `extensionId:layerId` |

## Comparison

|  | Internal | Embed panel | Sandbox |
| --- | --- | --- | --- |
| Runs where | Same JS bundle | Other document / origin | QuickJS Worker isolate |
| Authors with | OOP `Plugin` + builders | `h` / JSX → JSON tree | JS/TS + `openenvx.*`; optional HTML/`showUI` |
| Mutation | Direct register / workbench API | `panel:command` allowlist | Allowlisted `executeCommand` + widget `syncedState` |
| UI | Builders → descriptors → renderers | Tree → validate → **same** mappers → renderers | Sandboxed iframe or widget face |

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
| Element vocabulary, messages, `validatePluginTree`, grant types | `@xmazu/openenvxee-plugin-protocol` |
| Tree → builder mappers, `ExternalHostMount`, host surfaces | `@openenvx/headless` |
| `EmbedPanelHost`, `SandboxExtensionHost`, transport, gate, runtime | `@xmazu/openenvxee-workbench` |
| Widget click seam + default plugins | `@xmazu/openenvxee-studio` |
| Internal OOP plugins | `core` / `headless` / product plugins |

## Author guides

| Path | Doc |
| --- | --- |
| Internal OOP plugins | [apps/docs/extension-guide.md](../../apps/docs/extension-guide.md) |
| Trust, protocol messages, caps, marketplace | [Plugin-boundaries.md](../../Plugin-boundaries.md) |
| Cloud product API notes | openenvx-cloud `docs/embed/plugin-api.md` (sibling repo) |

## What not to expose to third parties

- Loading external JS into Studio
- `registerViewPanel` / `registerFieldRenderer` / `registerEditorPane` for untrusted code
- Binding external trees to internal paths without a host-owned write policy
- “Trust all origins” transports in production
