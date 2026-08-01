# Extension authoring — pick a path

**Widgets are objects on the canvas. Plugins are tools you run.** Start there, then pick the trust lane.

| You want… | Path | Guide |
| --- | --- | --- |
| An interactive object on the canvas / HTML page | **Sandbox widget** (`kind: 'widget'`) | [Sandbox guide](sandbox-extension-guide.md) |
| A user-run tool (import, setup, panel) | **Sandbox plugin** (`kind: 'plugin'`) | [Sandbox guide](sandbox-extension-guide.md) |
| First-party editor features in the same bundle | **Internal plugin** (`PluginManager`) | [Internal plugin guide](extension-guide.md) |
| Chrome from a parent page over an iframe embed | **Embed panel** (no QuickJS) | [Sandbox guide — embed](sandbox-extension-guide.md#embed-panels) |

```text
Widget  →  on-canvas face (data.values + data.children)
Plugin  →  off-canvas tool (showUI iframe + bridge)
Internal → full editor APIs (trusted OOP)
Embed   →  parent postMessage trees (weakest lane)
```

**Hard rule:** untrusted code never executes in the Studio main world. Do not load marketplace/customer JS via `PluginManager`.

Author packages (published): `@openenvx/widget-sdk` + `@openenvx/elements`.

Deep dives (trust taxonomy, protocol messages, caps):

- [docs/architecture/extensions.md](../../docs/architecture/extensions.md)
- [Plugin-boundaries.md](../../Plugin-boundaries.md)
- [docs/architecture/widget-bridge.md](../../docs/architecture/widget-bridge.md)
- [docs/architecture/packages-and-api.md](../../docs/architecture/packages-and-api.md)
