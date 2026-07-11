# OpenEnvx

**The composable foundation for building visual editors.**

Scene-first data model. VS Code-style plugin contributions. Compose only what you need.

> ⚠️ **Early Development**: This project is currently in early development. Features and APIs may change.

---

## What is OpenEnvx?

OpenEnvx is an **open-source monorepo** for building opinionated visual editors - canvas, commands, inspector, and export drivers wired through a plugin host.

### Packages

- **`@openenvx/schema`** - Scene document model and page presets
- **`@openenvx/preview`** - DOM preview rendering for layer types
- **`@openenvx/core`** - Scene model, plugins, commands, and contribution registries
- **`@openenvx/headless`** - `WorkbenchController` and headless editor runtime
- **`@openenvx/canvas`** - Canvas engine, layers, Konva stage, TipTap rich text, `CanvasBasicsPlugin`
- **`@openenvx/canvas-pro`** - Smart guides, alignment, distribution (closed source)
- **`@openenvx/driver-image`** - PNG, SVG, and PDF export driver

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

MIT License · [GitHub](https://github.com/openenvx/openenvx)
