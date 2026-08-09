# Publishing

> **Do not publish from an agent** — the owner publishes.

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@xmazu/openenvxee-extensions` | GitHub npm (`npm.pkg.github.com`, restricted) | Author SDK: `./protocol`, element subpaths, `defineExtension`, Vite |
| `@xmazu/openenvxee-html-studio` | GitHub npm (`npm.pkg.github.com`, restricted) | Per-module `dist/` ESM tree — curated HTML host API + `./runtime` |

Scene model, preview descriptors, and editor runtime live in **private** `@openenvx/core` (`./schema`, `./preview`, `.`, `./react`). They are **not** published separately. Canvas hosts use private `@openenvx/canvas-studio` in the monorepo (`packages/studio` is an unpublished build artifact only).

Export Worker lives in **openenvx-cloud** (`apps/export-service`), not this repo.

Everything else stays workspace-private and resolves from `src/` during local development.

**Hard rule:** published packages must **never** ship an `exports` `development` condition pointing at `src/`. Vite resolves `development` in product apps; published tarballs are `files: ["dist"]` only — that condition breaks consumers. Exports are `types` + `bun` / `import` / `default` → `dist/`.

Root scripts: `publish-packages`, `publish-package:extensions`, `publish-package:html-studio`, `verify-pack`.

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

## `@xmazu/openenvxee-html-studio`

Published HTML host package. Source of truth is private `@openenvx/html-studio`. Build emits a **per-module ESM tree** under `dist/` (Rollup `preserveModules`) so Vite can tree-shake file-by-file. Workspace `@openenvx/core` (schema/preview/runtime) is inlined from `packages/core/src`. Third-party UI deps stay external. Subpaths: `.`, `./runtime`, `./theme.css`.

Listed in root [`release.config.json`](release.config.json).

```bash
bun add @xmazu/openenvxee-html-studio
```

Owner publishes — agents must not. Product hosts own their blocks/plugins.

## External consumers (openenvx-cloud, etc.)

Legacy pins on `@xmazu/openenvxee-schema`, `@xmazu/openenvxee-preview`, or `@xmazu/openenvxee-studio` are no longer published from this repo. Migrate to `@xmazu/openenvxee-html-studio` / inlined core as appropriate, or vendor Scene helpers — **not** by publishing `@openenvx/core`.
