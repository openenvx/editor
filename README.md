# OpenEnvx

**Build visual editors that fit your product.**

OpenEnvx is an open-source foundation for canvas, HTML, and email editors. It gives you a schema-first document model, a headless runtime, and a contribution system for layers, commands, inspectors, and panels. Use a ready-made editor or compose the pieces around your own application.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](packages/html-studio/package.json) [![CI](https://github.com/openenvx/openenvx/actions/workflows/ci.yml/badge.svg)](https://github.com/openenvx/openenvx/actions/workflows/ci.yml)

> **Early development:** OpenEnvx is pre-1.0. APIs and package boundaries may change.

## Why OpenEnvx?

- **Own the document:** scenes are serializable JSON, suitable for persistence, automation, and server-side rendering.
- **Compose the editor:** choose canvas, HTML blocks, or email blocks instead of adopting one monolithic UI.
- **Extend by contribution:** add layer definitions, commands, property fields, views, and services through the plugin model.
- **Bring your shell:** use the bundled React workbench or build a custom host around the headless controller.
- **Keep untrusted code isolated:** sandbox extensions communicate through a validated protocol and worker boundary.

## Quick start

For the fastest path, install a published editor:

```bash
npm install @openenvx/html-studio react react-dom
```

```tsx
import { HtmlEditor } from '@openenvx/html-studio';
import '@openenvx/html-studio/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <HtmlEditor onChange={(scene) => console.log(scene)} />
    </div>
  );
}
```

Other ready-made editors:

- [`@openenvx/canvas-studio`](packages/canvas-studio/README.md) — absolute-positioned canvas documents.
- [`@openenvx/email-studio`](packages/email-studio/README.md) — responsive, email-safe block documents.

Each editor includes a `runtime` entry point for headless scene creation or rendering. See the package README for the complete public API.

## Choose your integration

| Goal | Start with |
| --- | --- |
| Drop in a complete editor | `@openenvx/canvas-studio`, `@openenvx/html-studio`, or `@openenvx/email-studio` |
| Build a custom editor shell | `@openenvx/core` plus `@openenvx/canvas` or `@openenvx/html` |
| Render or automate documents | A package's `runtime` entry point |
| Add trusted in-process features | The plugin and contribution APIs |
| Build isolated widgets or panels | [`@xmazu/openenvxee-extensions`](packages/extensions/README.md) |

## Repository layout

```text
packages/   reusable libraries and published editor packages
apps/       demos, package smoke tests, and documentation
docs/       architecture and integration guides
scripts/    release and repository tooling
```

The published MIT packages are the supported external entry points. Some lower-level workspace packages and product-specific integrations remain private while their APIs settle; the package catalog documents the boundary.

## Explore the docs

- [Architecture hub](Architecture.md) — package tiers, boundaries, and contribution flow.
- [Architecture chapters](docs/architecture/README.md) — runtime, workbench, canvas, HTML, email, extensions, and APIs.
- [Package and API guide](docs/architecture/packages-and-api.md) — what to import and what is intentionally internal.
- [Extension authoring](apps/docs/README.md) — trusted plugins and sandbox extensions.
- [Publishing guide](PUBLISHING.md) — package contents and maintainer release workflow.
- [Feature matrix](FEATURES.md) — current capabilities and roadmap.

## Development

Requirements: Node.js 24+ and Bun 1.3+.

```bash
bun install
bun run dev:playground
```

Useful checks:

```bash
bun run check
bun run check-types
bun run test
bun run build
```

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## Community

Bug reports and feature discussions belong in [GitHub Issues](https://github.com/openenvx/openenvx/issues). Please include the package, reproduction steps, expected behavior, and the smallest relevant scene or code sample.

## License

Public packages identify their license in their own `package.json` files. The published editor packages and extension SDK are MIT licensed; review the package boundary before depending on private workspace code.
