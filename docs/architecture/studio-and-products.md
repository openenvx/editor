# Studio & products

**Audience:** Internal engineers and coding agents. Packages: `@openenvx/canvas-studio`, `@xmazu/openenvxee-studio`, `@openenvx/html-studio`, `@xmazu/openenvxee-html-studio`, `@openenvx/email-studio`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Why fat bundles exist

Host product apps (dashboard Studio, embed host, demos) should not wire every private workspace package by hand. Studio packages:

1. Expose a curated host surface to mount and run the editor
2. Inline private deps into published `dist/` where applicable
3. Ship a default plugin list + sandbox factory helpers

Publishing intent: [PUBLISHING.md](../../PUBLISHING.md). Published OSS drop-ins: `@openenvx/email-studio`, `@openenvx/canvas-studio`. Published proprietary/restricted: `openenvxee-html-studio`, `extensions`. Private workspace: `html-studio`, unpublished `@xmazu/openenvxee-studio` (`packages/studio`).

## `@openenvx/canvas-studio` (canvas product — published)

Public npm drop-in for open-source canvas editor hosts. Inlines private core/canvas/workbench into minified ESM:

```ts
import { CanvasEditor, type Scene } from '@openenvx/canvas-studio';
import { createCanvasScene } from '@openenvx/canvas-studio/runtime';
import '@openenvx/canvas-studio/theme.css';
import '@openenvx/canvas-studio/fonts.css';

<CanvasEditor onChange={save} theme="dark" />
```

`CanvasEditor` defaults `initialScene` to `createCanvasScene()` when omitted. Headless scene factory is `@openenvx/canvas-studio/runtime`. Raster/PDF export is not included — use cloud export-service or your host pipeline.

Monorepo HMR stays on `@openenvx/canvas` + `@openenvx/workbench` (`apps/canvas-demo`). The published bundle is exercised by `apps/canvas-package-demo` (`bun run dev:canvas-package`).

## `@xmazu/openenvxee-studio` (canvas product — proprietary host allowlist)

Unpublished fat bundle source in `packages/studio`. Curated host allowlist: `WorkbenchShell`, `DEFAULT_STUDIO_PLUGINS`, `createSandboxExtensionHost`, layout/property helpers. External product hosts that need the full allowlist install the GitHub Packages build when published from product repos.

```ts
export const DEFAULT_STUDIO_PLUGINS = [new CanvasPlugin()];
```

`createSandboxExtensionHost(options)` wires canvas widget click binding + `WIDGET_LAYER_TYPE` so **workbench never imports canvas**; studio is the seam.

## `@openenvx/html-studio` (HTML product — monorepo)

Re-exports: `core`, `html`, workbench shell surface + HTML sandbox helper.

```ts
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
```

## `@xmazu/openenvxee-html-studio` (HTML product — published)

GitHub Packages publish of `@openenvx/html-studio`. Inlines workspace packages (workbench/html/core/…) into a **per-module `dist/` ESM tree** (Vite-tree-shakeable); third-party deps stay external. Subpaths:

- `.` — editor host surface (`WorkbenchShell`, plugins, authoring API) → `dist/openenvxee-html-studio/src/index.js`
- `./runtime` — Worker-safe block configs + `renderBlockDocument` (no TipTap / DnD / shell)
- `./theme.css` — workbench tokens

Product hosts (e.g. Snapvelo) own their blocks and sidebar plugins in the product repo and compose:

```ts
const PLUGINS = [...DEFAULT_HTML_STUDIO_PLUGINS, new MyEventPagePlugin()];
```

## `@openenvx/email-studio` (email product — published)

Public npm bundle for open-source email editor hosts. Inlines private core/html/driver-email/workbench into minified ESM (no source maps; CSS modules compiled into one file; public `.d.ts` does not leak the internal scene schema). Narrow API — no plugin authoring surface:

```ts
import { EmailEditor, type Scene } from '@openenvx/email-studio';
import { createEmailScene, renderEmailHtml } from '@openenvx/email-studio/runtime';
import '@openenvx/email-studio/theme.css';

<EmailEditor onChange={save} theme="dark" />
```

`EmailEditor` defaults `initialScene` to `createEmailScene()` when omitted. Chrome is the product **top bar** (Editor / HTML / Preview, undo/redo, device presets, save) plus a floating **bottom** insert toolbar (`editorToolbars: true`). The top-center preview toolbar is hidden when the top bar is on. Headless HTML export is `@openenvx/email-studio/runtime` so Node/SSR does not load the shell.

Monorepo HMR stays on `@openenvx/driver-email` + `@openenvx/workbench` (`apps/email-demo`). The published bundle is exercised by `apps/email-package-demo` (`bun run dev:email-package`).

## What hosts must not do

Per AGENTS.md product-host rules:

- Do **not** mount React panel views from the product host for form/settings — declare `ViewContribution` with `buildProperties` / `emptyMessage` / `when`
- Do **not** import shell-internal `ViewPane` / `PropertyContentRenderer`
- Use `registerViewPanel` only for non-form surfaces
- Embed **policy/data API** stays in editor-core; embed **product panels** (e.g. Embed Options) live in the product host repo, not canvas Inspector contributions

## Demo apps (monorepo)

| App                        | Role                                       |
| -------------------------- | ------------------------------------------ |
| `apps/canvas-demo`         | Canvas + workbench HMR + sandbox demos     |
| `apps/canvas-package-demo` | Published `@openenvx/canvas-studio` bundle |
| `apps/demo-playground`     | Composable / custom shell patterns         |
| `apps/html-demo`           | HTML block studio                          |
| `apps/email-demo`          | Email driver + workbench (HMR)             |
| `apps/email-package-demo`  | Published `@openenvx/email-studio` bundle  |
| `apps/docs`                | Extension guide and contracts              |

## Related

- [canvas.md](canvas.md) · [html.md](html.md) · [extensions.md](extensions.md)
