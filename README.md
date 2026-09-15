# OpenEnvx

**Build visual editors that fit your product.**

OpenEnvx is an open-source foundation for canvas, HTML, and email editors. It gives you a schema-first document model, a headless runtime, and a contribution system for layers, commands, inspectors, and panels. Use a ready-made editor or compose the pieces around your own application.

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE) [![CI](https://github.com/openenvx/openenvx/actions/workflows/ci.yml/badge.svg)](https://github.com/openenvx/openenvx/actions/workflows/ci.yml)

> **Early development:** OpenEnvx is pre-1.0. APIs and package boundaries may change.

## Why OpenEnvx?

- **Own the document:** scenes are serializable JSON, suitable for persistence, automation, and server-side rendering.
- **Compose the editor:** choose canvas, HTML blocks, or email blocks instead of adopting one monolithic UI.
- **Extend by contribution:** add layer definitions, commands, property fields, views, and services through the plugin model.
- **Bring your shell:** use the bundled React workbench or build a custom host around the headless controller.
- **Keep untrusted code isolated:** sandbox extensions communicate through a validated protocol and worker boundary.

## Quick start

For the fastest path, install the studio shell plus an artboard package:

```bash
npm install @openenvx/core @openenvx/studio @openenvx/html-driver react react-dom
```

```tsx
import { HtmlEditor } from '@openenvx/html-driver/studio';
import '@openenvx/studio/theme.css';
import '@openenvx/html-driver/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <HtmlEditor onChange={(scene) => console.log(scene)} />
    </div>
  );
}
```

Other drop-in editors:

- `@openenvx/canvas-driver/studio` - absolute-positioned canvas documents.
- `@openenvx/email-driver/studio` - responsive, email-safe block documents.

Each artboard package includes a `./runtime` entry point for headless scene creation or rendering. See [PUBLISHING.md](PUBLISHING.md) for the complete public API.

## Choose your integration

| Goal | Start with |
| --- | --- |
| Drop in a complete editor | `@openenvx/studio` + `@openenvx/canvas-driver/studio`, `@openenvx/html-driver/studio`, or `@openenvx/email-driver/studio` |
| Build a custom editor shell | `@openenvx/core` + `@openenvx/studio` + `@openenvx/canvas-driver` or `@openenvx/html-driver` |
| Render or automate documents | An artboard package's `./runtime` entry point |
| Add trusted in-process features | The plugin and contribution APIs on `@openenvx/core` |
| Build isolated widgets or panels | [`@openenvx/editor-sandbox`](packages/editor-sandbox/README.md) |

## Repository layout

```text
packages/   reusable libraries and published editor packages
apps/       demos and documentation
```

See [Architecture.md](Architecture.md) for package boundaries and contribution flow.
