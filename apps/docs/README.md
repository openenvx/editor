# Extension authoring — pick a path

OpenEnvx has **three different extension trees**. They are not interchangeable. Pick one before writing code.

| Path | Trust | Runs where | Author with | Guide |
| --- | --- | --- | --- | --- |
| **Internal plugin** | First-party, trusted | Same JS bundle as Studio (`PluginManager`) | OOP `Plugin` / `WorkbenchPlugin`, builders | [Internal plugin guide](extension-guide.md) |
| **Sandbox widget / plugin** | Untrusted | QuickJS Worker isolate (+ optional `showUI` iframe) | `@xmazu/openenvxee-elements` (`defineExtension`, `defineCanvasComponent` / `defineHtmlComponent`) | [Sandbox & embed guide](sandbox-extension-guide.md) |
| **Embed panel** | Parent page | Other document / origin (`postMessage`) | Protocol `RenderNode` trees (+ optional elements `/panel`) | [Sandbox & embed guide](sandbox-extension-guide.md#embed-panels) |

```text
Internal  →  PluginManager + DI          (full editor APIs)
Sandbox   →  QuickJS isolate + grants    (capability-gated bridge)
Embed     →  postMessage + validators   (no isolate JS in editor)
```

**Hard rule:** untrusted code never executes in the Studio main world. Do not load marketplace/customer JS via `PluginManager`. Do not write an internal `WorkbenchPlugin` when you meant a sandbox widget.

Architecture / trust deep-dives:

- [docs/architecture/extensions.md](../../docs/architecture/extensions.md)
- [Plugin-boundaries.md](../../Plugin-boundaries.md)
- [docs/architecture/widget-bridge.md](../../docs/architecture/widget-bridge.md)
- [docs/architecture/packages-and-api.md](../../docs/architecture/packages-and-api.md)
