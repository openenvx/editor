# Studio & products

**Audience:** Contributors and integrators. Packages: `@openenvx/core`, `@openenvx/studio`, `@openenvx/canvas-driver`, `@openenvx/html-driver`, `@openenvx/email-driver`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Composable publish stack

Host product apps install a shared shell plus only the artboard engines they need:

| Package | Role |
| --- | --- |
| `@openenvx/core` | Scene, `Plugin`, runtime, contributions |
| `@openenvx/studio` | `WorkbenchShell`, chrome defaults, `./theme.css` |
| `@openenvx/canvas-driver` | Canvas engine (`.`) + `./studio` drop-in + `./runtime` |
| `@openenvx/html-driver` | HTML engine (`.`) + `./studio` drop-in + `./runtime` |
| `@openenvx/email-driver` | Email engine (`.`) + `./studio` drop-in + `./runtime` |

**Hard rules:**

- `@openenvx/studio` never imports canvas/html/email.
- Artboard `.` and `./runtime` never import studio/workbench.
- Connection happens in the host or on each artboard's `./studio` preset.

Publishing details: [PUBLISHING.md](../../PUBLISHING.md).

## `@openenvx/studio`

Published workbench host surface. Inlines private `@openenvx/workbench` into minified ESM; peers `@openenvx/core`.

```ts
import {
  WorkbenchShell,
  registerDefaultWorkbenchBundle,
} from '@openenvx/studio';
import '@openenvx/studio/theme.css';
```

## `@openenvx/canvas-driver/studio`

Drop-in canvas editor:

```ts
import { CanvasEditor, type Scene } from '@openenvx/canvas-driver/studio';
import { createCanvasScene } from '@openenvx/canvas-driver/runtime';
import '@openenvx/studio/theme.css';
import '@openenvx/canvas-driver/theme.css';
import '@openenvx/canvas-driver/fonts.css';

<CanvasEditor onChange={save} theme="dark" />
```

Composable host:

```ts
import { WorkbenchShell } from '@openenvx/studio';
import {
  defaultCanvasStudio,
  createCanvasSandboxExtensionHost,
} from '@openenvx/canvas-driver/studio';
```

Monorepo HMR stays on `@openenvx/canvas-driver` + `@openenvx/workbench`. Published bundle is exercised by `apps/canvas-package-demo` (`bun run dev:canvas-package`).

## `@openenvx/html-driver/studio`

Drop-in HTML block editor:

```ts
import { HtmlEditor } from '@openenvx/html-driver/studio';
import { createHtmlScene, renderBlockDocument } from '@openenvx/html-driver/runtime';
import '@openenvx/studio/theme.css';
import '@openenvx/html-driver/theme.css';

<HtmlEditor onChange={save} theme="dark" />
```

Composable host:

```ts
import { WorkbenchShell } from '@openenvx/studio';
import {
  defaultHtmlStudio,
  createHtmlSandboxExtensionHost,
} from '@openenvx/html-driver/studio';

const PLUGINS = [...defaultHtmlStudio.plugins, new MyEventPagePlugin()];
```

Monorepo HMR stays on `@openenvx/html-driver` + `@openenvx/workbench`. Published bundle is exercised by `apps/html-package-demo` (`bun run dev:html-package`).

## `@openenvx/email-driver/studio`

Drop-in email editor:

```ts
import { EmailEditor, type Scene } from '@openenvx/email-driver/studio';
import { createEmailScene, renderEmailHtml } from '@openenvx/email-driver/runtime';
import '@openenvx/studio/theme.css';
import '@openenvx/email-driver/theme.css';

<EmailEditor onChange={save} theme="dark" />
```

Headless HTML export is `@openenvx/email-driver/runtime` so Node/SSR does not load the shell.

Monorepo HMR stays on `@openenvx/email-driver` + `@openenvx/workbench` (`packages/email-driver`). Published bundle is exercised by `apps/email-package-demo` (`bun run dev:email-package`).

## What hosts must not do

Per AGENTS.md product-host rules:

- Do **not** mount React panel views from the product host for form/settings - declare `ViewContribution` with `buildProperties` / `emptyMessage` / `when`
- Do **not** import shell-internal `ViewPane` / `PropertyContentRenderer`
- Use `registerViewPanel` only for non-form surfaces
- Embed **policy/data API** stays in editor-core; embed **product panels** live in the product host repo

## Demo apps (monorepo)

| App | Role |
| --- | --- |
| `apps/canvas-package-demo` | Published `@openenvx/canvas-driver/studio` bundle |
| `apps/html-package-demo` | Published `@openenvx/html-driver/studio` bundle |
| `apps/email-package-demo` | Published `@openenvx/email-driver/studio` bundle |
| `apps/demo-playground` | Composable / custom shell patterns |
| `apps/docs` | Extension guide and contracts |

## Related

- [canvas.md](canvas.md) · [html.md](html.md) · [extensions.md](extensions.md)
