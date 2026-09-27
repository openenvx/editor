# Studio & products

**Audience:** Contributors and integrators. Packages: `@openenvx/studio`, `@openenvx/canvas-driver`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Composable publish stack

Host product apps install a shared shell plus the canvas engine:

| Package | Role |
| --- | --- |
| `@openenvx/studio` | Scene, `Plugin`, runtime, contributions (package root `.`) |
| `@openenvx/studio/shell` | `WorkbenchShell`, chrome defaults, `./theme.css` / `./styles.css` |
| `@openenvx/canvas-driver` | Canvas engine (`.`) |

**Hard rules:**

- `@openenvx/studio` never imports canvas rendering.
- `@openenvx/canvas-driver` never imports `@openenvx/studio/shell`. It uses `@openenvx/studio` + `./schema` / `./preview` / `./react`.
- The host app wires `WorkbenchShell` (`@openenvx/studio/shell`) to `defaultCanvasWorkbench` (or a custom plugin list).

Publishing details: [PUBLISHING.md](../../PUBLISHING.md).

## `@openenvx/studio/shell`

Published workbench host surface. Inlines private `@openenvx/studio/internal` into minified ESM; peers `@openenvx/studio` (headless).

```ts
import {
  WorkbenchShell,
  registerDefaultWorkbenchBundle,
} from '@openenvx/studio/shell';
import '@openenvx/studio/styles.css';
```

## Canvas product host

```ts
import { WorkbenchShell } from '@openenvx/studio/shell';
import { createCanvasScene, defaultCanvasWorkbench } from '@openenvx/canvas-driver';
// Sandbox: import { createCanvasSandboxExtensionHost } from '@openenvx/canvas-driver/src/create-canvas-sandbox-extension-host';
import '@openenvx/studio/styles.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/canvas-driver/fonts.css';

<WorkbenchShell
  editorUri="openenvx://canvas/editor"
  initialScene={createCanvasScene()}
  layout={defaultCanvasWorkbench.layout}
  createPropertyHostContext={defaultCanvasWorkbench.createPropertyHostContext}
  plugins={defaultCanvasWorkbench.plugins}
/>
```

Published npm: `@openenvx/canvas-driver` (minified `.` entry). Monorepo HMR uses the same package root + `@openenvx/studio/internal`. `apps/canvas-package-demo` exercises the composable stack (`bun run dev:canvas-package`).

## What hosts must not do

Per AGENTS.md product-host rules:

- Do **not** mount React panel views from the product host for form/settings - declare `ViewContribution` with `buildProperties` / `emptyMessage` / `when`
- Do **not** import shell-internal `ViewPane` / `PropertyContentRenderer`
- Use `registerViewPanel` only for non-form surfaces
- Embed **policy/data API** stays in editor-core; embed **product panels** live in the product host repo

## Demo apps (monorepo)

| App | Role |
| --- | --- |
| `apps/canvas-package-demo` | Composable publish stack: `@openenvx/studio` + `defaultCanvasWorkbench` |
| `apps/canvas-next-demo` | Next.js consumer smoke reference |
| `apps/demo-playground` | Custom shell / integration experiments |
| `apps/docs` | Extension guide and contracts |

## Related

- [canvas.md](canvas.md) · [extensions.md](extensions.md)
