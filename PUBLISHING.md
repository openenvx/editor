# Publishing

> **Scope rename (breaking for consumers):** all published packages moved from `@xmazu/openenvxee-*` to `@openenvx/*` (e.g. `@openenvx/schema`, `@openenvx/studio`). **Do not publish from an agent** — the owner publishes. Update **openenvx-cloud** (and any embed hosts) to the new names in the same release window; until then those repos will fail to resolve.

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@openenvx/schema` | GitHub npm (`npm.pkg.github.com`) | Built `dist/` + `scene.schema.json` |
| `@openenvx/preview` | GitHub npm | Built `dist/` — preview descriptors + Render IR |
| `@openenvx/elements` | `registry.openenvx.com` (public) | Preact element vocabulary (`/canvas` `/html` `/panel`) |
| `@openenvx/widget-sdk` | `registry.openenvx.com` (public) | Authoring SDK (`define*`, `renderToElementTree`, Vite packaging) |
| `@openenvx/protocol` | `registry.openenvx.com` (public) | `RenderNode`, manifests, validators, sandbox grants |
| `@openenvx/studio` | `registry.openenvx.com` (restricted) | Single bundled `dist/` (inlines workbench, canvas, canvas-pro, agent, and their `@openenvx/*` deps) |

Export Worker lives in **openenvx-cloud** (`apps/export-service`), not this repo.

Everything else stays workspace-private and resolves from `src/` during local development.

## `@openenvx/schema`

Published shape:

- `files`: `dist/`, `scene.schema.json`
- Single bundled `dist/index.js` (no extensionless relative imports — Node-safe)
- `exports["."].default` → `./dist/index.js`
- `exports["."].development` → `./src/index.ts` (Vite monorepo / linked local dev)
- `exports["."].bun` → `./dist/index.js` (published tarballs omit `src/`; Bun must not resolve to missing sources)
- **Monorepo note:** Bun prefers the `bun` condition, so workspace Bun consumers read `dist/`, not live `src/`. Rebuild schema/preview after editing their sources (`bun run build --filter=@openenvx/schema --filter=@openenvx/preview`), or use Vite/`development` resolution. Vite apps are unaffected.
- `prepack` runs `build` automatically before publish
- `publishConfig.registry`: `https://npm.pkg.github.com`

Install in another project (requires `@xmazu` GitHub npm auth — see openenvx-cloud `.npmrc.example`):

```bash
bun add @openenvx/schema
```

### Local dev with `bun link`

```bash
# In editor-core
bun run link:schema

# In the consuming project
bun link @openenvx/schema
```

## `@openenvx/preview`

Same publish shape as schema. Depends on `@openenvx/schema`.

```bash
bun add @openenvx/preview
# local: bun run link:preview then bun link @openenvx/preview
```

## `@openenvx/elements`

Preact element vocabulary only (`/canvas`, `/html`, `/panel`). Workspace `exports` point at `src/` for HMR; `publishConfig.exports` are dist-only. Publish to `registry.openenvx.com`.

```bash
bun add @openenvx/elements
```

## `@openenvx/widget-sdk`

Authoring SDK (`defineExtension`, `define*Component`, `renderToElementTree`, `buildGrantFromManifest`, Vite `bundleWidgetSources`). Publish to `registry.openenvx.com`.

```bash
bun add @openenvx/widget-sdk
```

Backend round-trip: call `renderToElementTree()` in Node to emit `RenderNode` JSON for the templates API, then map with host applicators.

## `@openenvx/protocol`

Wire contract (`RenderNode`, `ExtensionManifest`, validators, sandbox grants). Workspace `exports` → `src/`; `publishConfig.exports` → `dist/`. Publish to `registry.openenvx.com`.

```bash
bun add @openenvx/protocol
```

## `@openenvx/studio`

Fat host bundle. Workspace `exports` → `src/` for HMR; `publishConfig.exports` → `dist/` only. Publish to `registry.openenvx.com` (restricted).
