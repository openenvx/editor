# Publishing

This is a maintainer reference for building and publishing the packages that leave the repository. Contributors should use the public package READMEs and [CONTRIBUTING.md](CONTRIBUTING.md) first.

> **Do not publish from an agent** — releases require maintainer credentials and review.

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@xmazu/openenvxee-extensions` | GitHub npm (`npm.pkg.github.com`, restricted) | MIT author SDK: `./protocol`, element subpaths, `defineExtension`, Vite |
| `@openenvx/html-studio` | npmjs (`registry.npmjs.org`, public) | Minified `dist/` ESM + CSS — `HtmlEditor` + host composition API + `./runtime` (`renderBlockDocument`) + `./theme.css`. Wide `.d.ts` for product hosts. |
| `@openenvx/email-studio` | npmjs (`registry.npmjs.org`, public) | Minified `dist/` ESM + one CSS file — `EmailEditor` + `./runtime` (`renderEmailHtml`) + `./theme.css`. No source maps; public `.d.ts` is a narrow surface. |
| `@openenvx/canvas-studio` | npmjs (`registry.npmjs.org`, public) | Minified `dist/` ESM + CSS — `CanvasEditor` + `./runtime` (`createCanvasScene`) + `./theme.css` + `./fonts.css`. No source maps; narrow `.d.ts`. |

Scene model, preview descriptors, and editor runtime live in workspace `@openenvx/core` (`./schema`, `./preview`, `.`, `./react`). They are **not** published separately. Monorepo canvas hosts use `@openenvx/canvas` + `@openenvx/workbench` (HMR). Product host allowlists live on unpublished `@xmazu/openenvxee-studio` (`packages/studio`).

Export Worker lives in **openenvx-cloud** (`apps/export-service`), not this repo.

Everything else stays workspace-private and resolves from `src/` during local development.

**Hard rule:** published packages must **never** ship an `exports` `development` condition pointing at `src/`. Vite resolves `development` in product apps; published tarballs are `files: ["dist"]` only — that condition breaks consumers. Exports are `types` + `bun` / `import` / `default` → `dist/`.

Root scripts: `publish-packages`, `publish-studio-packages`, `version:studios`, `release:studios`, `publish-package:extensions`, `publish-package:html-studio`, `publish-package:email-studio`, `publish-package:canvas-studio`, `verify-pack`.

### Studio trio (`html-studio`, `email-studio`, `canvas-studio`)

Bump all three to the **same** version, verify tarballs, and publish to npmjs (owner only):

```bash
bun run release:studios              # patch (default)
bun run release:studios -- minor
bun run release:studios -- 0.2.0
```

Bump versions only (no build/publish):

```bash
bun run version:studios -- patch
```

Publish current versions without bumping (uses `npm publish --access public` — required for scoped `@openenvx/*` packages, including first publish of `html-studio`):

```bash
bun run publish-studio-packages
```

`bun publish` in-package can 404 on packages that do not exist on npm yet; studio publish scripts pack a tarball and run `bun publish --access public <tgz>` via [`scripts/publish-npm-public.ts`](scripts/publish-npm-public.ts) (no separate `npm` CLI required).

Implemented in [`scripts/release-studios.ts`](scripts/release-studios.ts); package list comes from [`release.config.json`](release.config.json).

## `@xmazu/openenvxee-extensions`

Merged sandbox **author** package (replaces `@xmazu/openenvxee-protocol`, `@openenvx/elements`, `@openenvx/widget-sdk`).

| Subpath | Use |
| --- | --- |
| `.` | `defineExtension`, `define*Component`, `renderToElementTree`, `buildGrantFromManifest` |
| `./protocol` | Hosts: `RenderNode`, manifests, validators, sandbox grants (no Preact) |
| `./canvas` / `./html` / `./panel` | Preact element vocabulary |
| `./vite` | `bundleWidgetSources()` for isolates |
| `./openenvx` | Ambient types for QuickJS |

```bash
bun add @xmazu/openenvxee-extensions
```

**Registry:** GitHub Packages (`https://npm.pkg.github.com`), `access: restricted` under `@xmazu`.

Hosts depend on the same package but import only `@xmazu/openenvxee-extensions/protocol` so Preact does not enter the editor bundle.

## `@openenvx/html-studio`

Published HTML block editor for open-source and product hosts. Inlines private `@openenvx/core`, `@openenvx/html`, and `@openenvx/workbench` into minified ESM:

- `.` — `HtmlEditor` (`dist/index.js`, `"use client"`) + host composition API (`WorkbenchShell`, plugins, contributions) + `dist/index.css`
- `./runtime` — `createHtmlScene` + `renderBlockDocument` + block registry (no shell / TipTap / CSS)
- `./theme.css` — same file as `dist/index.css`

Release tarball is `files: ["dist"]` only: minified JS, one minified CSS file, `sandbox-worker.js`, and a **wide** public `.d.ts` (product hosts compose custom plugins). No source maps.

Third-party UI deps stay external.

Listed in root [`release.config.json`](release.config.json).

```bash
npm install @openenvx/html-studio
```

Owner publishes to npm — agents must not.

## `@openenvx/email-studio`

Published email editor for open-source hosts. Inlines private `@openenvx/core`, `@openenvx/html`, `@openenvx/driver-email`, and `@openenvx/workbench` (MIT, unpublished) into minified ESM:

- `.` — `EmailEditor` (`dist/index.js`, `"use client"`) + `dist/index.css` (tokens + compiled CSS modules)
- `./runtime` — `createEmailScene` + `renderEmailHtml` (no shell / TipTap / CSS)
- `./theme.css` — same file as `dist/index.css`

Release tarball is `files: ["dist"]` only: minified JS, one minified CSS file, and a **narrow** public `.d.ts` (`EmailEditor`, opaque `Scene`, HTML export helpers). No source maps, declaration maps, CSS module trees, or inlined internal schema types.

Third-party UI deps stay external. No plugin/command/sandbox surface.

Listed in root [`release.config.json`](release.config.json).

```bash
npm install @openenvx/email-studio
```

Owner publishes to npm — agents must not.

## `@openenvx/canvas-studio`

Published canvas editor for open-source hosts. Inlines private `@openenvx/core`, `@openenvx/canvas`, and `@openenvx/workbench` into minified ESM:

- `.` — `CanvasEditor` (`dist/index.js`, `"use client"`) + `dist/index.css`
- `./runtime` — `createCanvasScene` (no shell / Konva / CSS)
- `./theme.css` — same file as `dist/index.css`
- `./fonts.css` — canvas font catalog (hosts must allow Google Fonts in CSP)

Narrow public `.d.ts` (`CanvasEditor`, opaque `Scene`, scene factory). No raster/PDF export — use cloud export-service or your host pipeline.

Listed in root [`release.config.json`](release.config.json).

```bash
npm install @openenvx/canvas-studio
```

Owner publishes to npm — agents must not.

## External consumers (openenvx-cloud, etc.)

Legacy pins on `@xmazu/openenvxee-schema`, `@xmazu/openenvxee-preview`, `@xmazu/openenvxee-studio`, or `@xmazu/openenvxee-html-studio` are no longer published from this repo. Migrate to `@openenvx/html-studio` / inlined core as appropriate, or vendor Scene helpers — **not** by publishing `@openenvx/core`.
