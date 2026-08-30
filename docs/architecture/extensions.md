# Extensions - internal vs sandbox

**Audience:** Engineers and integrators. Trust detail: [Plugin-boundaries.md](../../Plugin-boundaries.md).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md) · Widget bridge: [widget-bridge.md](widget-bridge.md).

## Hard rule

**Untrusted extension code must never execute inside the Studio / editor main world.**

## Two ownership trees

| Term | Meaning | Not |
| --- | --- | --- |
| **Plugin** / **WorkbenchPlugin** | Trusted first-party in-process OOP on `PluginManager` | Marketplace / untrusted; external hosts |
| **Sandbox extension** / `SandboxExtensionHost` | Untrusted QuickJS grant (Worker isolate); `mountSandboxExtensions` | Internal OOP; `PluginManager` |

Sandbox grants split:

|  | **Sandbox plugin** (`kind: 'plugin'`) | **Sandbox widget** (`kind: 'widget'`) |
| --- | --- | --- |
| Mental model | Tool you run | Object on the canvas |
| Primary UI | Off-canvas floating `showUI` panel (iframe) | On-canvas face from `@xmazu/openenvxee-extensions` (`data.children`) |
| Lifetime | User-run command; Stop closes isolate | Lives with matching layers; **one isolate per `extensionId`** |
| Delivery | `artifactUrl` + `contentHash`, or pushed `source` | Prefer pushed `source` via parent `widget:source` |

Widgets use `defineCanvasComponent` / `defineHtmlComponent` from `@xmazu/openenvxee-extensions`. The host expands (`renderWidgetFace`), maps the tree to layers, and stores under `data.children`. **Persistent state is host `data.values`**. See [widget-bridge.md](widget-bridge.md).

## Comparison

|  | Internal | Sandbox |
| --- | --- | --- |
| Runs where | Same JS bundle | QuickJS Worker isolate |
| Authors with | OOP `Plugin` + builders (monorepo / future host façade) | `@xmazu/openenvxee-extensions` + `openenvx.*` in isolate |
| Mutation | Direct register / workbench API | Allowlisted `executeCommand` + widget `values` |
| UI | Builders → descriptors → renderers | Sandboxed iframe or widget face layers |

## Mount path

```text
WorkbenchShell mountExternalHosts
  → SandboxExtensionHost (workbench)
  → ExternalHostMount.mountSandbox (core)
  → SandboxHostSurface
```

Studio’s `createSandboxExtensionHost` binds canvas widget clicks without workbench importing canvas.

## Package map

| Concern | Package |
| --- | --- |
| Author SDK (protocol subpath, elements, defineExtension, Vite) | `@xmazu/openenvxee-extensions` |
| Host: tree → builders, `ExternalHostMount`, sandbox surface | `@openenvx/core` |
| Host: QuickJS runtime, `showUI`, sandbox chrome | `@openenvx/workbench` |
| Canvas widget seam + default plugins | `@xmazu/openenvxee-studio` (`packages/studio`) |
| Internal OOP plugins | `core` / product plugins |

**Boundary:** `@xmazu/openenvxee-extensions` is author-facing only. Hosts import `@xmazu/openenvxee-extensions/protocol` for validators; rendering stays in workbench + canvas/html.

## Author guides

| Doc | Use |
| --- | --- |
| [extensions-sandbox-guide.md](extensions-sandbox-guide.md) | Sandbox widgets / plugins |
| [extensions-host-guide.md](extensions-host-guide.md) | Internal OOP plugins (monorepo) |
| [roadmap.md](roadmap.md) | Planned host React plugin API |
| [Plugin-boundaries.md](../../Plugin-boundaries.md) | Trust, caps, marketplace |

## What not to expose to third parties

- Loading external JS into Studio’s main world
- React `registerViewPanel` / field renderers for untrusted code without validated trees
- Binding external trees to internal paths without a host-owned write policy
