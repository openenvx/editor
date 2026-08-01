# Publishing

Packages that leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@xmazu/openenvxee-schema` | GitHub npm (`npm.pkg.github.com`) | Built `dist/` + `scene.schema.json` |
| `@xmazu/openenvxee-preview` | GitHub npm | Built `dist/` — preview descriptors + Render IR |
| `@xmazu/openenvxee-plugin-protocol` | `registry.openenvx.com` (public) | Declarative panel tree + `h`/jsx runtime (no React) |
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

## `@xmazu/openenvxee-plugin-protocol`
