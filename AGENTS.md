# Agent instructions

Instructions for coding agents working in the OpenEnvx monorepo.

## Git / agent workflow (hard rules)

- **Never create or use git worktrees** (`git worktree`, isolated worktree agents, etc.). Work only in this checkout.
- **Never commit** (and never push). Leave staging and commits to the human; do not run `git commit` unless they explicitly ask in that message.

## What this repo is

OpenEnvx is a composable visual editor framework: plugins register layers, commands, and UI contributions; a headless controller owns scene state; apps compose their own React shell. The monorepo uses **Bun** workspaces:

| Path         | Contents                                                |
| ------------ | ------------------------------------------------------- |
| `packages/*` | Publishable libraries (`core`, `canvas`, `headless`, …) |
| `apps/*`     | Demo apps (`demo-playground`, `docs`)                   |
| `examples/*` | Example plugins (`image-plugin`)                        |

## Documentation map

| Document | Use when |
| --- | --- |
| [Architecture.md](Architecture.md) | Package boundaries, contribution flow, where code belongs |
| [FEATURES.md](FEATURES.md) | Product capability matrix, Polotno gap tracking, what we should still offer |
| [apps/docs/extension-guide.md](apps/docs/extension-guide.md) | Plugin author API, contribution kinds |
| [packages/canvas/README.md](packages/canvas/README.md) | Canvas install and `CanvasBasicsPlugin` |

Read **Architecture.md** before placing new code. Update **FEATURES.md** when adding or removing a user-facing editor capability.

## Package placement (hard rules)

| Put it here | Examples |
| --- | --- |
| `@openenvx/core` | `Command`, `LayerDefinition`, `Plugin`, `EditorRuntime`, `PluginManager`, scene store, `PropertyBuilder`, `Registry` |
| `@openenvx/headless` | `WorkbenchController`, `WorkbenchState`, `WorkbenchPlugin`, workbench contributions (`ToolbarContribution`, `InspectorPaneContribution`, …), provider registries (`registerFieldRenderer`, …), `InspectorPaneBuilder`, `WorkbenchProvider`, `useWorkbenchContext` |
| `@openenvx/canvas` | Konva stage, interactions, layer renderers, `CanvasBasicsPlugin`, `CanvasEditor`, `CanvasHostProvider` |
| `@xmazu/openenvxee-plugin-protocol` | Declarative embed panel tree types, `h`/jsx runtime, message unions, `validatePluginTree` |

### Canvas rule (non-negotiable)

**All canvas rendering and interactions go in `@openenvx/canvas`.** Never add canvas implementations to `core`.

| Do | Don't |
| --- | --- |
| Add a Konva renderer in `packages/canvas/src/renderers/` | Add canvas renderer types to `core` |
| Register renderers via `registerCanvasContribution()` | Hardcode preview `kind` switches in app shell |
| Use `CanvasEditor` + `CanvasHostProvider` in the app shell | Put workbench-aware editor pane wiring in `@openenvx/canvas` |
| Use `CanvasBasicsPlugin` for built-in canvas engine features | Create app-only canvas plugins without registering contributions |

## Licensing / publishing intent

Internal workspace libraries (`core`, `headless`, `preview`, `canvas`, `driver-image`, `workbench`, `canvas-pro`, `agent`, …) are **private** and not published. Their `exports` point at **TypeScript `src/`** so Vite/Bun apps hot-reload and TypeScript resolves types from source without rebuilding.

Published packages:

- **`@openenvx/schema`** — scene model, Zod schemas, template helpers. Ships `dist/` to the registry; monorepo and `bun link` consumers resolve `src/` via export conditions. See [PUBLISHING.md](PUBLISHING.md).
- **`@xmazu/openenvxee-plugin-protocol`** — declarative embed panel protocol (`h`, jsx runtimes, `validatePluginTree`, message types). Ships `dist/`; published `exports` are dist-only (see [PUBLISHING.md](PUBLISHING.md)).
- **`@xmazu/openenvxee-studio`** — product fat bundle. Build inlines `@xmazu/openenvxee-workbench`, `@openenvx/canvas`, `@xmazu/openenvxee-canvas-pro`, `@openenvx/agent`, `@openenvx/driver-image`, and their `@openenvx/*` deps into `dist/`. Re-exports `@openenvx/core` + `@openenvx/headless` so host apps can author plugins without private workspace packages. Published `exports` resolve to `dist/` only. Monorepo apps that need `src/` HMR alias studio in Vite/tsconfig (see `apps/canvas-demo`).

## Code conventions

### File naming

All source files use **kebab-case** filenames.

| Good                    | Bad                    |
| ----------------------- | ---------------------- |
| `segmented-control.tsx` | `SegmentedControl.tsx` |
| `canvas-editor.tsx`     | `CanvasEditor.tsx`     |
| `use-workbench.ts`      | `useWorkbench.ts`      |

- **`.ts` / `.tsx` files:** kebab-case only.
- **React component names** stay PascalCase in code; only the **file path** is kebab-case.
- **CSS modules:** kebab-case (`canvas-editor.module.css`).
- **Tests:** `*.test.ts` / `*.test.tsx` beside the module, same kebab-case stem.

Match the surrounding package convention before creating files.

### Type and interface naming

Do **not** use Hungarian `I` prefixes on interfaces or type aliases.

| Good                           | Bad                             |
| ------------------------------ | ------------------------------- |
| `interface RenderIrDocument`   | `interface IRenderIrDocument`   |
| `interface ExportRunnerResult` | `interface IExportRunnerResult` |
| `type ServerKnownPreviewKind`  | `type IServerKnownPreviewKind`  |

- Prefer `interface` for object shapes; use `type` for unions and aliases.
- Name interfaces and types in **PascalCase** without a leading `I`.
- `bun run check:interface-names` enforces this in CI and pre-commit.

### No backward compatibility until 1.0.0

All packages are pre-1.0.0. Breaking API changes are expected and preferred over maintaining legacy paths.

- Do **not** add migration shims, dual code paths, deprecated API fallbacks, or compatibility adapters for removed APIs.
- **Remove** dead code when replacing an API instead of keeping the old path alive.
- Do **not** run deprecation cycles — rename or replace in place and update callers in the same change.
- After **1.0.0**, semver applies and breaking changes require a major version bump.

### Implementation discipline

- Minimize scope - smallest correct diff.
- Match surrounding naming, types, and patterns.
- Do not over-abstract or add tests that only assert the obvious.

## Common tasks

| Task | Where |
| --- | --- |
| Add canvas layer type | `packages/canvas/src/layers/` + register in `CanvasBasicsPlugin` |
| Add custom preview `kind` | Canvas contribution class + `registerCanvasContribution(ctx, …)` |
| Add shell UI chrome | `apps/demo-playground/src/` or your own app |
| Wire canvas editor to workbench | App shell: `CanvasHostProvider` + `AbsoluteEditorPane` (see `apps/demo-playground`) |
| Add generic plugin contribution | `packages/core` contribution + `ctx.register()` |
| Add workbench UI contribution | `@openenvx/headless` + `ctx.registerWorkbench()` via `WorkbenchPlugin` |
| Add flow layer type | `packages/canvas/src/layers/` |

## Commands

```bash
bun install
bun run test          # all packages
bun run build
bun run dev:playground
bun run fix           # auto-fix lint/format (ultracite)
bun run check         # lint (ultracite) + knip
bun run precommit     # check + build + test (run before finishing)
bun run changeset     # create a release changeset
```

## Publishing

Only `packages/studio` (`@xmazu/openenvxee-studio`), `packages/schema` (`@openenvx/schema`), and `packages/plugin-protocol` (`@xmazu/openenvxee-plugin-protocol`) are published (private registry via `publishConfig`). See [README.md](README.md), [PUBLISHING.md](PUBLISHING.md), and the `publish-packages` script in root `package.json`.

## Before you finish

After all code changes for the task are done, **always** run these from the repo root and fix every failure before stopping:

1. `bun run fix` — apply Ultracite auto-fixes
2. `bun run precommit` — `check` + `build` + `test`

If either command fails, fix the reported errors, then re-run both until they pass. Do not leave lint, format, knip, build, or test failures unresolved.

Also verify:

- [ ] No new canvas code under `packages/core`
- [ ] New files use kebab-case
- [ ] No `I`-prefixed interface or type alias names
- [ ] No backward-compat shims for removed APIs
- [ ] Architecture or extension docs updated if you changed package boundaries or plugin APIs
- [ ] [FEATURES.md](FEATURES.md) updated if you added, removed, or materially changed a user-facing editor capability
