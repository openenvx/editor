# Publishing

Three packages leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@openenvx/schema` | `registry.openenvx.com` (public) | Built `dist/` + `scene.schema.json` |
| `@xmazu/openenvxee-plugin-protocol` | `registry.openenvx.com` (public) | Declarative panel tree + `h`/jsx runtime (no React) |
| `@xmazu/openenvxee-studio` | `registry.openenvx.com` (restricted) | Single bundled `dist/` (inlines workbench, canvas, canvas-pro, agent, driver-image, and their `@openenvx/*` deps) |

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

## `@xmazu/openenvxee-plugin-protocol`

Published shape is **dist-only** on every export condition (no `development` / `bun` → `src/` — those files are not in the tarball).

Subpath exports:

- `@xmazu/openenvxee-plugin-protocol` — types, `h`, elements, message unions
- `@xmazu/openenvxee-plugin-protocol/jsx-runtime` — TS/JSX automatic runtime
- `@xmazu/openenvxee-plugin-protocol/jsx-dev-runtime` — dev runtime (same as production)

Install:

```bash
bun add @xmazu/openenvxee-plugin-protocol --registry https://registry.openenvx.com
```

Local dev with `bun link`:

```bash
# In editor-core
bun run link:plugin-protocol

# In the consuming project
bun link @xmazu/openenvxee-plugin-protocol
```

For iframe embeds, use `createPostMessagePluginPanelTransport` from `@xmazu/openenvxee-workbench` with an explicit `allowedOrigins` (and `targetOrigin` when more than one origin is listed). `PluginPanel` trusts whatever the transport delivers; it does not validate `postMessage` origins by itself.

## `@xmazu/openenvxee-studio`

Studio is the **published product bundle**. Internally:

| Workspace package | Role |
| --- | --- |
| `@openenvx/core` | Plugin/command/service authoring API (re-exported) |
| `@openenvx/headless` | Workbench controller + contribution types (re-exported) |
| `@xmazu/openenvxee-workbench` | React shell UI (`WorkbenchShell`, fields, theme) |
| `@openenvx/canvas` | Konva canvas engine |
| `@xmazu/openenvxee-canvas-pro` | Pro chrome (toolbars, sidebars, smart guides) |
| `@openenvx/agent` | AI agent sidebar |
| `@openenvx/driver-image` | Image/SVG export driver |

`tsup` sets `noExternal: [/^@openenvx\//, /^@xmazu\/openenvxee-/]`, so those packages are compiled into `dist/index.js`. Studio also re-exports `@openenvx/core` and `@openenvx/headless` so host apps can author plugins (`Plugin`, `Command`, `PersistenceService`, …) without installing private workspace packages. Published `package.json` must not list any `@openenvx/*` or `@xmazu/openenvxee-*` runtime dependency.

Workspace packages stay in `devDependencies` for types while building the bundle. Published `exports` are **dist-only** (`types` / `import` / `default` → `dist/`). Do not add `development` / `bun` → `src/` — `src/` is not shipped in the npm tarball and breaks Vite consumers.

Install:

```bash
bun add @xmazu/openenvxee-studio --registry https://registry.openenvx.com
```

Host apps typically:

```ts
import {
  WorkbenchShell,
  DEFAULT_STUDIO_PLUGINS,
  DEFAULT_CANVAS_LAYOUT,
  createCanvasDemoScene,
  createCanvasPropertyHostContextWithApi,
  createLocalStorageWorkbenchLayoutStore,
  // plugin authoring (from core, bundled + re-exported)
  Plugin,
  Command,
  PersistenceServiceId,
  type PersistenceService,
  type PluginContext,
  type CommandContext,
} from '@xmazu/openenvxee-studio';
import '@xmazu/openenvxee-studio/theme.css';
import '@xmazu/openenvxee-studio/fonts.css';
```

Agent chat and Template data panels register via their plugins (`registerViewPanel` + `ViewContribution`).

`@xmazu/openenvxee-workbench` is **not** published — compose from studio, or use workspace packages directly inside this monorepo (see `apps/demo-playground` for a minimal OSS shell without studio).

## Release workflow

**Cloud-facing release** (`@xmazu/platforms-cli` — same `platforms release publish` everywhere):

```bash
# From editor-core (release.config.json at repo root)
platforms release publish patch
platforms release sync-consumers
```

`release.config.json` at repo root limits publish to `@xmazu/openenvxee-plugin-protocol` and `@xmazu/openenvxee-studio`, then syncs semver deps in `../openenvx-cloud`. With no config, `platforms release publish` would ship every non-private workspace package instead.

**Changeset-driven release** (all three published packages, changelog + git tag):

```bash
# 1. Add a changeset for schema, plugin-protocol, and/or studio
bun run changeset

# 2. Version + changelog
bun run version-packages

# 3. Build, publish all published packages, tag
bun run release:changeset
```

Dry-run pack checks:

```bash
bun run verify-pack          # schema + plugin-protocol + studio
bun run verify-pack:schema
bun run verify-pack:plugin-protocol
bun run verify-pack:studio
```

Publish individually:

```bash
bun run publish-package:schema
bun run publish-package:plugin-protocol
bun run publish-package:studio
```
