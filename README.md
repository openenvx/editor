# OpenEnvx

**The composable foundation for building visual editors.**

Scene-first data model. VS Code-style plugin contributions. Compose only what you need.

> ⚠️ **Early Development**: This project is currently in early development. Features and APIs may change.

---

## What is OpenEnvx?

OpenEnvx is a monorepo for building opinionated visual editors - canvas, commands, inspector, and export drivers wired through a plugin host.

### Packages

Workspace libraries (private, not published — `exports` point at TypeScript `src/` for HMR and type resolution without rebuilding):

- **`@openenvx/schema`** - Scene document model and page presets _(also published — see [PUBLISHING.md](PUBLISHING.md))_
- **`@openenvx/preview`** - DOM preview rendering for layer types
- **`@openenvx/core`** - Scene model, plugins, commands, and contribution registries
- **`@openenvx/headless`** - `WorkbenchController` and headless editor runtime
- **`@openenvx/canvas`** - Canvas engine, layers, Konva stage, TipTap rich text, `CanvasBasicsPlugin`
- **`@openenvx/driver-image`** - PNG, SVG, and PDF export driver
- **`@xmazu/openenvxee-workbench`** - React workbench UI shell (`WorkbenchShell`, fields, theme)
- **`@xmazu/openenvxee-canvas-pro`** - Pro canvas chrome (toolbars, sidebars, smart guides)
- **`@openenvx/agent`** - AI agent sidebar plugin

Published packages (see [PUBLISHING.md](PUBLISHING.md)):

- **`@openenvx/schema`** - Scene document model, Zod schemas, and template helpers
- **`@xmazu/openenvxee-studio`** - Product fat bundle (workbench + canvas + canvas-pro + agent + driver-image)

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

## Architecture docs

- [Architecture.md](Architecture.md) — hub (tiers, placement, contribution sketch)
- [docs/architecture/](docs/architecture/overview.md) — under-the-hood chapters
- [Plugin-boundaries.md](Plugin-boundaries.md) — internal vs embed vs sandbox trust model
- [apps/docs/extension-guide.md](apps/docs/extension-guide.md) — plugin author API

---

[GitHub](https://github.com/openenvx/openenvx)
