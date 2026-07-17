# Publishing

Two packages leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@openenvx/schema` | `registry.openenvx.com` (public) | Built `dist/` + `scene.schema.json` |
| `@xmazu/openenvxee-studio` | `registry.openenvx.com` (restricted) | Single bundled `dist/` (inlines `@openenvx/core`, `@openenvx/headless`, `@openenvx/schema`) |

Everything else stays workspace-private and resolves from `src/` during local development.

## `@openenvx/schema`

Published shape:

- `files`: `dist/`, `scene.schema.json`
- `exports["."].default` → `./dist/index.js`
- `exports["."].development` / `exports["."].bun` → `./src/index.ts` (monorepo + linked local dev)
- `prepack` runs `build` automatically before `bun publish`

Install in another project:

```bash
bun add @openenvx/schema --registry https://registry.openenvx.com
```

### Local dev with `bun link`

When you are editing schema in this repo and consuming it from another project (e.g. weselnemomenty):

```bash
# In editor-core
bun run link:schema
# or: cd packages/schema && bun link

# In the consuming project
bun link @openenvx/schema
```

Bun resolves the linked package through the `bun` export condition, so types and runtime come from `src/` without rebuilding `dist/`.

To go back to the registry version:

```bash
# In the consuming project
bun unlink @openenvx/schema
bun add @openenvx/schema --registry https://registry.openenvx.com
```

## `@xmazu/openenvxee-studio`

Studio is a **fat bundle**: `tsup` sets `noExternal: [/^@openenvx\//]`, so every `@openenvx/*` import used by studio is compiled into `dist/index.js`. Published `package.json` must not list any `@openenvx/*` runtime dependency.

Workspace packages stay in `devDependencies` for types and local HMR via the `development` export condition.

Install:

```bash
bun add @xmazu/openenvxee-studio --registry https://registry.openenvx.com
```

Studio does **not** bundle `@openenvx/canvas`, `@openenvx/driver-image`, or other app-level packages — those stay separate and are composed by the host app (see `apps/demo-playground`).

## Release workflow

```bash
# 1. Add a changeset for schema and/or studio
bun run changeset

# 2. Version + changelog
bun run version-packages

# 3. Build, publish both packages, tag
bun run release
```

Dry-run pack checks:

```bash
bun run verify-pack          # schema + studio
bun run verify-pack:schema
bun run verify-pack:studio
```

Publish individually:

```bash
bun run publish-package:schema
bun run publish-package:studio
```
