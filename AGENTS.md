# Agent instructions

Instructions for coding agents working in the OpenEnvx monorepo.

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
| [apps/docs/extension-guide.md](apps/docs/extension-guide.md) | Plugin author API, contribution kinds |
| [packages/canvas/README.md](packages/canvas/README.md) | Canvas OSS install and `CanvasBasicsPlugin` |

Read **Architecture.md** before placing new code.

## Package placement (hard rules)

| Put it here | Examples |
| --- | --- |
| `@openenvx/core` | `Command`, `LayerDefinition`, `Plugin`, scene store, `PropertyBuilder` |
| `@openenvx/headless` | `WorkbenchController`, `WorkbenchState`, `WorkbenchPlugin`, workbench contributions (`ToolbarContribution`, `EditorPaneContribution`, …), `InspectorPaneBuilder`, `WorkbenchProvider`, `useWorkbenchContext` |
| `@openenvx/canvas` | Konva stage, interactions, layer renderers, `CanvasBasicsPlugin`, `CanvasEditor`, `CanvasHostProvider` |

### Canvas rule (non-negotiable)

**All canvas rendering and interactions go in `@openenvx/canvas`.** Never add canvas implementations to `core`.

| Do | Don't |
| --- | --- |
| Add a Konva renderer in `packages/canvas/src/renderers/` | Add canvas renderer types to `core` |
| Register renderers via `registerCanvasContribution()` | Hardcode preview `kind` switches in app shell |
| Use `CanvasEditor` + `CanvasHostProvider` in the app shell | Put workbench-aware editor pane wiring in `@openenvx/canvas` |
| Use `CanvasBasicsPlugin` for built-in canvas engine features | Create app-only canvas plugins without registering contributions |

## Licensing intent

`core`, `headless`, `canvas`, and drivers are **OSS (MIT)**.

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

### No backward compatibility

Do not add migration shims, dual code paths, or fallbacks for removed APIs. Remove dead code instead of supporting legacy paths.

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
bun run check         # lint (ultracite)
bun run changeset     # create a release changeset
```

## Publishing

OSS packages publish to npm as `@openenvx/*`. See [README.md](README.md) and the `publish-packages` script in root `package.json`.

## Before you finish

- [ ] `bun run test` passes for affected packages
- [ ] No new canvas code under `packages/core`
- [ ] New files use kebab-case
- [ ] No backward-compat shims for removed APIs
- [ ] Architecture or extension docs updated if you changed package boundaries or plugin APIs
