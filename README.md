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
npm install @openenvx/studio/core @openenvx/studio @openenvx/html-driver react react-dom
```

```tsx
import { createHtmlScene, defaultHtmlWorkbench } from '@openenvx/html-driver';
import { WorkbenchShell } from '@openenvx/studio';
import '@openenvx/html-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <WorkbenchShell
        editorUri="openenvx://html/editor"
        initialScene={createHtmlScene()}
        layout={defaultHtmlWorkbench.layout}
        plugins={defaultHtmlWorkbench.plugins}
        onSceneChange={(scene) => console.log(scene)}
      />
    </div>
  );
}
```

Other artboard drivers:

- `@openenvx/canvas-driver` — `defaultCanvasWorkbench` (absolute-positioned canvas).
- `@openenvx/email-driver` — `defaultEmailWorkbench` (responsive, email-safe blocks).

Each artboard package exposes headless helpers on the same `.` entry (e.g. `createHtmlScene`, `renderEmailHtml`). See [PUBLISHING.md](PUBLISHING.md) for the complete public API.

## Choose your integration

| Goal | Start with |
| --- | --- |
| Full product editor | `@openenvx/studio` + driver `default*Workbench` (npm package root) |
| Build a custom editor shell | `@openenvx/studio/core` + `@openenvx/studio` + `@openenvx/canvas-driver` or `@openenvx/html-driver` |
| Render or automate documents | Artboard package root (e.g. `renderEmailHtml`, `exportCanvasDocument`) |
| Add trusted in-process features | The plugin and contribution APIs on `@openenvx/studio/core` |
| Build isolated widgets or panels | [`@openenvx/editor-sandbox`](packages/editor-sandbox/README.md) |

## Repository layout

```text
packages/   reusable libraries and published editor packages
apps/       demos and documentation
```

See [Architecture.md](Architecture.md) for package boundaries and contribution flow.
