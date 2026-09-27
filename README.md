# OpenEnvx

**Build visual editors that fit your product.**

OpenEnvx is an open-source foundation for canvas editors. It gives you a schema-first document model, a headless runtime, and a contribution system for layers, commands, inspectors, and panels. Use a ready-made editor or compose the pieces around your own application.

[![License: MPL-2.0](https://img.shields.io/badge/license-MPL--2.0-blue.svg)](LICENSE) [![CI](https://github.com/openenvx/openenvx/actions/workflows/ci.yml/badge.svg)](https://github.com/openenvx/openenvx/actions/workflows/ci.yml)

> **Early development:** OpenEnvx is pre-1.0. APIs and package boundaries may change.

## Why OpenEnvx?

- **Own the document:** scenes are serializable JSON, suitable for persistence, automation, and server-side rendering.
- **Compose the editor:** build on the canvas engine and extend with plugins instead of adopting one monolithic UI.
- **Extend by contribution:** add layer definitions, commands, property fields, views, and services through the plugin model.
- **Bring your shell:** use the bundled React workbench or build a custom host around the headless controller.
- **Keep untrusted code isolated:** sandbox extensions communicate through a validated protocol and worker boundary.

## Quick start

For the fastest path, install the studio shell plus the canvas driver:

```bash
npm install @openenvx/studio @openenvx/canvas-driver react react-dom
```

```tsx
import {
  createCanvasScene,
  defaultCanvasWorkbench,
} from '@openenvx/canvas-driver';
import { WorkbenchShell } from '@openenvx/studio/shell';
import '@openenvx/canvas-driver/fonts.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/studio/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <WorkbenchShell
        editorUri="openenvx://canvas/editor"
        initialScene={createCanvasScene()}
        layout={defaultCanvasWorkbench.layout}
        plugins={defaultCanvasWorkbench.plugins}
        onSceneChange={(scene) => console.log(scene)}
      />
    </div>
  );
}
```

The canvas package exposes headless helpers on the same `.` entry (e.g. `createCanvasScene`, `exportCanvasDocument`). See [PUBLISHING.md](PUBLISHING.md) for the complete public API.

## Choose your integration

| Goal | Start with |
| --- | --- |
| Full product editor | `@openenvx/studio` + `@openenvx/canvas-driver` `defaultCanvasWorkbench` |
| Build a custom editor shell | `@openenvx/studio` + `@openenvx/studio/shell` + `@openenvx/canvas-driver` |
| Render or automate documents | `@openenvx/canvas-driver` (e.g. `exportCanvasDocument`) |
| Add trusted in-process features | The plugin and contribution APIs on `@openenvx/studio` |
| Build isolated widgets or panels | [`@openenvx/editor-sandbox`](packages/editor-sandbox/README.md) |

## Repository layout

```text
packages/   reusable libraries and published editor packages
apps/       demos and documentation
```

See [Architecture.md](Architecture.md) for package boundaries and contribution flow.
