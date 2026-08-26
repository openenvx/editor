# Studio & products

**Audience:** Internal engineers and coding agents. Packages: `@openenvx/canvas-studio`, `@xmazu/openenvxee-studio`, `@openenvx/html-studio`, `@xmazu/openenvxee-html-studio`, `@openenvx/email`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Why fat bundles exist

Host product apps (dashboard Studio, embed host, demos) should not wire every private workspace package by hand. Studio packages:

1. Expose a curated host surface to mount and run the editor
2. Inline private deps into published `dist/` where applicable
3. Ship a default plugin list + sandbox factory helpers

Publishing intent: [PUBLISHING.md](../../PUBLISHING.md). Published today: `studio`, `openenvxee-html-studio`, `@openenvx/email`, `schema`, `preview`, `protocol`, `elements`, and `widget-sdk`. Private workspace packages (`canvas-studio`, `html-studio`, …) stay unpublished.

## `@openenvx/canvas-studio` (canvas product — monorepo)

Private workspace package. Same curated host allowlist as the published studio, but resolves TypeScript `src/` via `workspace:*` (not bundled). Monorepo hosts (`apps/canvas-demo`) import this for HMR.

## `@xmazu/openenvxee-studio` (canvas product — published)

Fat GitHub Packages bundle. Re-exports `@openenvx/canvas-studio` and inlines workbench/canvas into `dist/`. External product hosts install this.

```ts
export const DEFAULT_STUDIO_PLUGINS = [new CanvasPlugin()];
```

Pages/Layers + dirty status come from `WorkbenchShell` defaults — not from this list.

`createSandboxExtensionHost(options)` wires canvas widget click binding + `WIDGET_LAYER_TYPE` so **workbench never imports canvas**; studio is the seam.

Host apps typically:

1. Use shell props with `DEFAULT_STUDIO_PLUGINS`
2. Mount `WorkbenchShell` with optional `mountExternalHosts` for embed/sandbox
3. Import `@openenvx/canvas-studio` in monorepo Vite apps for HMR (published hosts use `@xmazu/openenvxee-studio`)

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

## `@openenvx/email` (email product — published)

Public npm bundle for open-source email editor hosts. Inlines private core/html/driver-email/workbench into minified ESM. Narrow API — no plugin authoring surface:

```ts
import { EmailEditor, createEmailScene } from '@openenvx/email';
import { renderEmailHtml } from '@openenvx/email/runtime';
import '@openenvx/email/theme.css';

<EmailEditor onChange={save} theme="dark" />
```

`EmailEditor` defaults `initialScene` to `createEmailScene()` when omitted. Chrome is the product **top bar** (Editor / HTML / Preview, undo/redo, device presets, save) plus a floating **bottom** insert toolbar (`editorToolbars: true`). The top-center preview toolbar is hidden when the top bar is on. Headless HTML export is `@openenvx/email/runtime` so Node/SSR does not load the shell.

Monorepo HMR stays on `@openenvx/driver-email` + `@openenvx/workbench` (`apps/email-demo`). The published bundle is exercised by `apps/email-package-demo` (`bun run dev:email-package`).

## What hosts must not do

Per AGENTS.md product-host rules:

- Do **not** mount React panel views from the product host for form/settings — declare `ViewContribution` with `buildProperties` / `emptyMessage` / `when`
- Do **not** import shell-internal `ViewPane` / `PropertyContentRenderer`
- Use `registerViewPanel` only for non-form surfaces
- Embed **policy/data API** stays in editor-core; embed **product panels** (e.g. Embed Options) live in the product host repo, not canvas Inspector contributions

## Demo apps (monorepo)

| App                       | Role                                  |
| ------------------------- | ------------------------------------- |
| `apps/canvas-demo`        | Studio + canvas + external host demos |
| `apps/demo-playground`    | Composable / custom shell patterns    |
| `apps/html-demo`          | HTML block studio                     |
| `apps/email-demo`         | Email driver + workbench (HMR)        |
| `apps/email-package-demo` | Published `@openenvx/email` bundle    |
| `apps/docs`               | Extension guide and contracts         |

## Related

- [canvas.md](canvas.md) · [html.md](html.md) · [extensions.md](extensions.md)
