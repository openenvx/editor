# Publishing

> **Scope rename (breaking for consumers):** published packages moved from `@openenvx/{schema,preview,protocol,studio}` back to `@xmazu/openenvxee-{schema,preview,protocol,studio}` (elements + widget-sdk stay `@openenvx/`*). **Do not publish from an agent** — the owner publishes. Update **openenvx-cloud** (and any embed hosts) to the new names in the same release window; until then those repos will fail to resolve.

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@xmazu/openenvxee-schema` | GitHub npm (`npm.pkg.github.com`) | Built `dist/` + `scene.schema.json` |
| `@xmazu/openenvxee-preview` | GitHub npm | Built `dist/` — preview descriptors + Render IR |
| `@openenvx/elements` | `registry.openenvx.com` (public) | Preact element vocabulary (`/canvas` `/html` `/panel`) |
| `@openenvx/widget-sdk` | `registry.openenvx.com` (public) | Authoring SDK (`define*`, `renderToElementTree`, Vite packaging) |
| `@xmazu/openenvxee-protocol` | `registry.openenvx.com` (public) | `RenderNode`, manifests, validators, sandbox grants |
| `@xmazu/openenvxee-studio` | GitHub npm (`npm.pkg.github.com`, restricted) | Bundled `dist/` — curated canvas host API (no sourcemaps on `latest`) |
| `@xmazu/openenvxee-html-studio` | GitHub npm (`npm.pkg.github.com`, restricted) | Per-module `dist/` ESM tree — curated HTML host API + `./runtime` |

Export Worker lives in **openenvx-cloud** (`apps/export-service`), not this repo.

Everything else stays workspace-private and resolves from `src/` during local development.

**Hard rule:** published packages must **never** ship an `exports` `development` condition pointing at `src/`. Vite resolves `development` in product apps; published tarballs are `files: ["dist"]` only — that condition breaks consumers. Exports are `types` + `bun` / `import` / `default` → `dist/`.

## `@xmazu/openenvxee-schema`

Published shape:

- `files`: `dist/`, `scene.schema.json`
- Single bundled `dist/index.js` (no extensionless relative imports — Node-safe)
- `exports["."]` → `dist/` (`types` / `bun` / `import` / `default`)
- **Monorepo note:** Bun prefers the `bun` condition, so workspace Bun consumers read `dist/`. Rebuild schema/preview after editing their sources (`bun run build --filter=@xmazu/openenvxee-schema --filter=@xmazu/openenvxee-preview`).
- `prepack` runs `build` automatically before publish
- `publishConfig.registry`: `https://npm.pkg.github.com`

Install in another project (requires `@xmazu` GitHub npm auth — see openenvx-cloud `.npmrc.example`):

```bash
bun add @xmazu/openenvxee-schema
```

### Local dev with `bun link`

```bash
# In editor-core
bun run link:schema

# In the consuming project
bun link @xmazu/openenvxee-schema
```

## `@xmazu/openenvxee-preview`

Same publish shape as schema. Depends on `@xmazu/openenvxee-schema`.

```bash
bun add @xmazu/openenvxee-preview
# local: bun run link:preview then bun link @xmazu/openenvxee-preview
```

## `@openenvx/elements`

Preact element vocabulary only (`/canvas`, `/html`, `/panel`). Same export matrix as schema. Publish to `registry.openenvx.com`.

```bash
bun add @openenvx/elements
```

## `@openenvx/widget-sdk`

Authoring SDK (`defineExtension`, `define*Component`, `renderToElementTree`, `buildGrantFromManifest`, Vite `bundleWidgetSources`). Same export matrix as schema. Publish to `registry.openenvx.com`.

```bash
bun add @openenvx/widget-sdk
```

Backend round-trip: call `renderToElementTree()` in Node to emit `RenderNode` JSON for the templates API, then map with host applicators.

## `@xmazu/openenvxee-protocol`

Wire contract (`RenderNode`, `ExtensionManifest`, validators, sandbox grants). Same export matrix as schema. Publish to `registry.openenvx.com`.

```bash
bun add @xmazu/openenvxee-protocol
```

## `@xmazu/openenvxee-studio`

Fat canvas host bundle (inlines workbench, canvas, canvas-pro — **not** html/agent). Source of truth for the curated host API is private `@openenvx/canvas-studio`; this package re-exports and bundles it. See [`packages/canvas-studio/src/index.ts`](packages/canvas-studio/src/index.ts).

Published tarball is `files: ["dist"]` only; exports → `dist/`.

**Registry:** GitHub Packages (`https://npm.pkg.github.com`), `access: restricted` under `@xmazu`.

```bash
bun add @xmazu/openenvxee-studio
```

### Publish flavors

| Command | Tag | Version | Contents |
| --- | --- | --- | --- |
| `bun publish` (or root `publish-package:studio` / `platforms release publish`) | `latest` | `X.Y.Z` | `dist/` **without** sourcemaps |
| `bun run publish:debug` (or root `publish-package:studio:debug`) | `debug` | `X.Y.Z-debug.N` | `dist/` **with** sourcemaps (`sourcesContent`) |

```bash
# Debuggable install
bun add @xmazu/openenvxee-studio@debug
```

## `@xmazu/openenvxee-html-studio`

Published HTML host package. Source of truth is private `@openenvx/html-studio`. Build emits a **per-module ESM tree** under `dist/` (Rollup `preserveModules`) so Vite can tree-shake file-by-file — not a single fat `index.js`. Third-party UI deps (`react`, `@tanstack/react-virtual`, TipTap, Radix, …) stay external; only workspace packages are inlined. `sandbox-worker.js` remains a self-contained Worker bundle next to the workbench sandbox module. The `lazy()` boundary around `HtmlRichTextEditor` survives into `dist/`, so consumers get TipTap/ProseMirror as a separate chunk fetched on first text edit (~400 KB out of the editor's initial payload). Subpaths: `.`, `./runtime`, `./theme.css`.

Listed in root [`release.config.json`](release.config.json).

```bash
bun add @xmazu/openenvxee-html-studio
```

Owner publishes — agents must not. Product hosts own their blocks/plugins.
