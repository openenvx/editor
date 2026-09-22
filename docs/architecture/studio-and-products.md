# Studio & products

**Audience:** Contributors and integrators. Packages: `@openenvx/studio`, `@openenvx/studio`, `@openenvx/canvas-driver`, `@openenvx/html-driver`, `@openenvx/email-driver`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Composable publish stack

Host product apps install a shared shell plus only the artboard engines they need:

| Package | Role |
| --- | --- |
| `@openenvx/studio` | Scene, `Plugin`, runtime, contributions (package root `.`) |
| `@openenvx/studio/shell` | `WorkbenchShell`, chrome defaults, `./theme.css` / `./styles.css` |
| `@openenvx/canvas-driver` | Canvas engine (`.`) |
| `@openenvx/html-driver` | HTML engine (`.`) |
| `@openenvx/email-driver` | Email engine (`.`) |

**Hard rules:**

- `@openenvx/studio` never imports canvas/html/email.
- Artboard drivers never import `@openenvx/studio/shell`. They use `@openenvx/studio` + `./schema` / `./preview` / `./react`.
- The host app wires `WorkbenchShell` (`@openenvx/studio/shell`) to each driver's `default*Workbench` (or a custom plugin list).

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

## HTML product host

```ts
import { WorkbenchShell } from '@openenvx/studio/shell';
import { defaultHtmlWorkbench } from '@openenvx/html-driver';
import { createHtmlScene } from '@openenvx/html-driver';
import '@openenvx/studio/styles.css';

const plugins = [...defaultHtmlWorkbench.plugins, new MyEventPagePlugin()];
```

Published npm: `@openenvx/html-driver`. `apps/html-package-demo` (`bun run dev:html-package`).

## Email product host

```ts
import { WorkbenchShell } from '@openenvx/studio/shell';
import { defaultEmailWorkbench } from '@openenvx/email-driver';
import { createEmailScene } from '@openenvx/email-driver';
import '@openenvx/studio/styles.css';
```

Headless HTML export is `renderEmailHtml` from `@openenvx/email-driver` so Node/SSR can skip shell CSS. `apps/email-package-demo` (`bun run dev:email-package`).

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
| `apps/html-package-demo` | Composable publish stack: `@openenvx/studio` + `defaultHtmlWorkbench` |
| `apps/email-package-demo` | Composable publish stack: `@openenvx/studio` + `defaultEmailWorkbench` |
| `apps/demo-playground` | Custom shell / integration experiments |
| `apps/docs` | Extension guide and contracts |

## Related

- [canvas.md](canvas.md) · [html.md](html.md) · [extensions.md](extensions.md)
