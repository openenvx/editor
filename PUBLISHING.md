# Publishing

Two packages leave this monorepo:

| Package | Registry | What ships |
| --- | --- | --- |
| `@openenvx/schema` | `registry.openenvx.com` (public) | Built `dist/` + `scene.schema.json` |
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

## `@xmazu/openenvxee-studio`

Studio is the **published product bundle**. Internally:

| Workspace package | Role |
| --- | --- |
| `@xmazu/openenvxee-workbench` | React shell UI (`WorkbenchShell`, fields, theme) |
| `@openenvx/canvas` | Konva canvas engine |
| `@xmazu/openenvxee-canvas-pro` | Pro chrome (toolbars, sidebars, smart guides) |
| `@openenvx/agent` | AI agent sidebar |
| `@openenvx/driver-image` | Image/SVG export driver |

`tsup` sets `noExternal: [/^@openenvx\//, /^@xmazu\/openenvxee-/]`, so those packages are compiled into `dist/index.js`. Published `package.json` must not list any `@openenvx/*` or `@xmazu/openenvxee-*` runtime dependency.

Workspace packages stay in `devDependencies` for types while building the bundle. Published `exports` point at `dist/` only — host apps always resolve the built package.

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
  createCanvasInspectorHostContextWithApi,
  ChatPanel,
  TemplateDataPanel,
  AGENT_CHAT_CONTAINER_ID,
  TEMPLATE_DATA_CONTAINER_ID,
} from '@xmazu/openenvxee-studio';
import '@xmazu/openenvxee-studio/theme.css';
import '@xmazu/openenvxee-studio/fonts.css';
```

`@xmazu/openenvxee-workbench` is **not** published — compose from studio, or use workspace packages directly inside this monorepo (see `apps/demo-playground` for a minimal OSS shell without studio).

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
