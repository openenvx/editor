# Agent instructions

Instructions for coding agents working in the OpenEnvx monorepo.

## What this repo is

OpenEnvx is a composable visual editor framework: plugins register layers, commands, and UI contributions; a headless controller owns scene state; optional React shell (`workbench`) provides the app chrome. The monorepo uses **Bun** workspaces:

| Path | Contents |
| --- | --- |
| `packages/*` | Publishable libraries (`core`, `canvas`, `headless`, `workbench`, …) |
| `apps/*` | Demo apps (`canvas-demo`, `docs`) |
| `examples/*` | Example plugins (`image-plugin`) |

## Documentation map

| Document | Use when |
| --- | --- |
| [Architecture.md](Architecture.md) | Package boundaries, OSS vs closed, contribution flow, where code belongs |
| [packages/workbench/Design.md](packages/workbench/Design.md) | Visual UI spec only - tokens, layout, components, quality checklist |
| [apps/docs/extension-guide.md](apps/docs/extension-guide.md) | Plugin author API, contribution kinds |
| [packages/canvas/README.md](packages/canvas/README.md) | Canvas OSS install and `CanvasBasicsPlugin` |

Read **Architecture.md** before placing new code. Read **Design.md** before changing workbench visuals.

## Package placement (hard rules)

| Put it here | Examples |
| --- | --- |
| `@xmazu/workbench-core` | `Command`, `LayerDefinition`, `Plugin`, generic `EditorPaneContribution`, scene store, property builder |
| `@xmazu/workbench-headless` | `WorkbenchController`, `WorkbenchState`, `WorkbenchProvider`, `useWorkbenchContext` |
| `@xmazu/workbench-canvas` | **All canvas code** - stage, editor, layers, renderers, interactions, preview DOM, clipboard, `CanvasBasicsPlugin`, editor panes |
| `@xmazu/workbench` | Shell chrome only - `WorkbenchShell`, sidebars, inspector layout, `PropertyPanelRenderer` |
| `@xmazu/workbench-canvas` | Canvas engine, absolute + flow layers, Konva/TipTap editor panes |

### Canvas rule (non-negotiable)

**Everything canvas-related goes in `@xmazu/workbench-canvas`.** Never add canvas implementations to `core` or `workbench`.

| Do | Don't |
| --- | --- |
| Add a Konva renderer in `packages/canvas/src/renderers/` | Add canvas renderer types to `core` |
| Register renderers via `registerCanvasContribution()` | Hardcode preview `kind` switches in workbench |
| Add `AbsoluteEditorPane` in canvas | Put editor pane components in workbench |
| Use `CanvasBasicsPlugin` for built-in canvas features | Create workbench-only canvas plugins |

## Licensing intent

`core`, `headless`, `canvas`, and drivers are **OSS (MIT)**. `workbench` is **closed source**. Keep the split clean so packages can ship under different licenses without refactors.

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
| Add shell UI chrome | `packages/workbench/src/` only |
| Add generic plugin contribution | `packages/core` contribution + `ctx.register()` |
| Add flow layer type | `packages/canvas/src/layers/` |

## Commands

```bash
bun install
bun run test          # all packages
bun run build
bun run dev:canvas    # canvas demo app
bun run check         # lint (ultracite)
bun run changeset     # create a release changeset
```

## Publishing

Packages publish to GitHub Packages as `@xmazu/*`. See [README.md](README.md#publishing) for install and release workflow details.

## Before you finish

- [ ] `bun run test` passes for affected packages
- [ ] No new canvas code under `packages/workbench` or `packages/core` (types in `core/services/canvas-registry-types.ts` are the serialized state contract only)
- [ ] New files use kebab-case
- [ ] No backward-compat shims for removed APIs
- [ ] Architecture or extension docs updated if you changed package boundaries or plugin APIs
