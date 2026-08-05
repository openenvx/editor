# Publishing

> **Scope rename (breaking for consumers):** published packages moved from `@openenvx/{schema,preview,protocol,studio}` back to `@xmazu/openenvxee-{schema,preview,protocol,studio}` (elements + widget-sdk stay `@openenvx/*`). **Do not publish from an agent** — the owner publishes. Update **openenvx-cloud** (and any embed hosts) to the new names in the same release window; until then those repos will fail to resolve.

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@xmazu/openenvxee-schema` | GitHub npm (`npm.pkg.github.com`) | Built `dist/` + `scene.schema.json` |
| `@xmazu/openenvxee-preview` | GitHub npm | Built `dist/` — preview descriptors + Render IR |
| `@openenvx/elements` | `registry.openenvx.com` (public) | Preact element vocabulary (`/canvas` `/html` `/panel`) |
| `@openenvx/widget-sdk` | `registry.openenvx.com` (public) | Authoring SDK (`define*`, `renderToElementTree`, Vite packaging) |
| `@xmazu/openenvxee-protocol` | `registry.openenvx.com` (public) | `RenderNode`, manifests, validators, sandbox grants |
| `@xmazu/openenvxee-studio` | `registry.openenvx.com` (restricted) | Single bundled `dist/` (inlines workbench, canvas, canvas-pro, agent, and their `@openenvx/*` deps) |

Export Worker lives in **openenvx-cloud** (`apps/export-service`), not this repo.

Everything else stays workspace-private and resolves from `src/` during local development.

## `@xmazu/openenvxee-schema`

Published shape:

- `files`: `dist/`, `scene.schema.json`
- Single bundled `dist/index.js` (no extensionless relative imports — Node-safe)
- `exports["."].default` → `./dist/index.js`
- `exports["."].development` → `./src/index.ts` (Vite monorepo / linked local dev)
- `exports["."].bun` → `./dist/index.js` (published tarballs omit `src/`; Bun must not resolve to missing sources)
- **Monorepo note:** Bun prefers the `bun` condition, so workspace Bun consumers read `dist/`, not live `src/`. Rebuild schema/preview after editing their sources (`bun run build --filter=@xmazu/openenvxee-schema --filter=@xmazu/openenvxee-preview`), or use Vite/`development` resolution. Vite apps are unaffected.
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

Preact element vocabulary only (`/canvas`, `/html`, `/panel`). Same export matrix as schema (`development` → `src/`, `bun`/`import`/`default` → `dist/`). Publish to `registry.openenvx.com`.

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

Wire contract (`RenderNode`, `ExtensionManifest`, validators, sandbox grants). Same export matrix as schema (`development` → `src/`, `bun`/`import`/`default` → `dist/`). Publish to `registry.openenvx.com`.

```bash
bun add @xmazu/openenvxee-protocol
```

## `@xmazu/openenvxee-studio`

Fat canvas host bundle (inlines workbench, canvas, canvas-pro, agent — **not** html/snapvelo). Same export matrix as schema (`development` → `src/` for Vite HMR; Bun prefers `dist/` — rebuild after source edits, or use Vite/`development`). Publish to `registry.openenvx.com` (restricted). HTML hosts use private `@openenvx/html-studio`; Snapvelo composes `@openenvx/html-studio` + `@openenvx/snapvelo`.
