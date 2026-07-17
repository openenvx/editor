# OpenEnvx

**The composable foundation for building visual editors.**

Scene-first data model. VS Code-style plugin contributions. Compose only what you need.

> ⚠️ **Early Development**: This project is currently in early development. Features and APIs may change.

---

## What is OpenEnvx?

OpenEnvx is a monorepo for building opinionated visual editors - canvas, commands, inspector, and export drivers wired through a plugin host.

### Packages

Workspace libraries (private, not published — `exports` point at TypeScript `src/` for HMR and type resolution without rebuilding):

- **`@openenvx/schema`** - Scene document model and page presets *(also published — see [PUBLISHING.md](PUBLISHING.md))*
- **`@openenvx/preview`** - DOM preview rendering for layer types
- **`@openenvx/core`** - Scene model, plugins, commands, and contribution registries
- **`@openenvx/headless`** - `WorkbenchController` and headless editor runtime
- **`@openenvx/canvas`** - Canvas engine, layers, Konva stage, TipTap rich text, `CanvasBasicsPlugin`
- **`@openenvx/driver-image`** - PNG, SVG, and PDF export driver

Published packages (see [PUBLISHING.md](PUBLISHING.md)):

- **`@openenvx/schema`** - Scene document model, Zod schemas, and template helpers
- **`@xmazu/openenvxee-studio`** - React workbench UI; bundles the `@openenvx/*` libraries it needs

---

## Philosophy

**OpenEnvx is not:**

- A single monolithic design tool
- A closed, all-in-one editor product
- Canvas logic scattered across packages

**OpenEnvx is:**

- A composable editor framework
- Plugins that register layers, commands, views, and services
- Commands as the mutation hub - scene state flows through one path

---

[GitHub](https://github.com/openenvx/openenvx)
