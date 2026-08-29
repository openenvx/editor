# Architecture chapters

These chapters explain how OpenEnvx is structured for contributors and integrators. Start with the [repository README](../../README.md) for installation, then use the [architecture hub](../../Architecture.md) to choose a topic.

| Chapter | Topic |
| --- | --- |
| [overview.md](overview.md) | Mental model, tiers, how pieces connect |
| [runtime-and-core.md](runtime-and-core.md) | EditorRuntime, PluginManager, scene, commands |
| [workbench-and-headless.md](workbench-and-headless.md) | Controller, contributions, shell, property panes |
| [property-fields.md](property-fields.md) | `PropertyFieldDescriptor`, field kinds, `layout`, pane authoring |
| [canvas.md](canvas.md) | `@openenvx/canvas` engine and `CanvasPlugin` |
| [html.md](html.md) | HTML block editor and slots |
| [html-editor-surfaces.md](html-editor-surfaces.md) | Stage / artboard / page-root naming + click selection |
| [driver-email.md](driver-email.md) | Email block editor (React-Email) |
| [studio-and-products.md](studio-and-products.md) | Studio / html-studio fat bundles |
| [extensions.md](extensions.md) | Internal vs sandbox (summary) |
| [extensions-sandbox-guide.md](extensions-sandbox-guide.md) | Sandbox widget/plugin authoring |
| [extensions-host-guide.md](extensions-host-guide.md) | Internal OOP plugins |
| [roadmap.md](roadmap.md) | Package/API roadmap and known boundaries |
| [packages-and-api.md](packages-and-api.md) | Package map, public exports, stability rules |

Companion: [Plugin-boundaries.md](../../Plugin-boundaries.md) · Extension authoring: [apps/docs/README.md](../../apps/docs/README.md) · Contribution guide: [CONTRIBUTING.md](../../CONTRIBUTING.md).
