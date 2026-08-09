# Agent instructions

Instructions for coding agents working in the OpenEnvx monorepo.

## Git / agent workflow (hard rules)

- **Never create or use git worktrees** (`git worktree`, isolated worktree agents, etc.). Work only in this checkout.
- **Never commit** (and never push). Leave staging and commits to the human; do not run `git commit` unless they explicitly ask in that message.
- **Never remove or disable a user-facing editor feature** (selection chrome, clone/delete menu, toolbars, panels, commands, etc.) to “fix” layout/spacing/bugs — without **explicit approval in that message**. Fix the root cause; keep the feature. `chromeDisplay: 'contents'` (or any trick that drops the selection menu) is only for hard structural cases already established (e.g. `email.column` / `<td>`), not a general spacing hammer.

## Thermos / thermo-nuclear reviews

When using thermos skills (thermo-nuclear review, thermo-nuclear code-quality review, or similar) to review code, go beyond bugs and style.

**Architecture docs check (required):** Before scoring the diff, read [Architecture.md](Architecture.md) and the relevant chapters under [docs/architecture/](docs/architecture/overview.md) (pick by what the change touches — e.g. workbench → `workbench-and-headless.md`, canvas → `canvas.md`, html/email → `html.md` / `driver-email.md`, packages/exports → `packages-and-api.md`). Verify the change **follows** those docs: package tiers, placement cheat sheet, contribution flow, public API boundaries, and hard rules (canvas not in `core`, host sidebars via contributions, etc.). Flag drifts from the written architecture as first-class findings, not nits. Also use [Plugin-boundaries.md](Plugin-boundaries.md) when the diff touches embed/sandbox/external plugins.

**Especially** look for:

- **Architecture** — package/module boundaries, contribution flow, whether code lives in the right package (`core` / `canvas` / `html` / `driver-*` / `workbench` / host), and conformance to the docs above
- **Tight coupling** — cross-package imports that skip the public surface, host/shell leaking into libraries, scene/UI entangled with protocol or sandbox concerns; flag spaghetti and push SOLID / KISS so modules stay loosely coupled and easy to change
- **Design patterns** — where a known pattern would clarify or shrink the design (and whether existing ones—contributions, registries, property paths, sandbox bridges—are followed or duplicated ad hoc)
- **Refactor opportunities** — extract shared helpers once, delete dead paths, simplify over-built abstractions; prefer a concrete follow-up over vague “could be cleaner”

Call these out as first-class findings, not afterthoughts.

## What this repo is

OpenEnvx is a composable visual editor framework: plugins register layers, commands, and UI contributions; a headless controller owns scene state; apps compose their own React shell. The monorepo uses **Bun** workspaces:

| Path         | Contents                                                 |
| ------------ | -------------------------------------------------------- |
| `packages/*` | Publishable libraries (`core`, `canvas`, `workbench`, …) |
| `apps/*`     | Demo apps (`demo-playground`, `docs`)                    |
| `examples/*` | Example plugins (`image-plugin`)                         |

## Documentation map

| Document | Use when |
| --- | --- |
| [Architecture.md](Architecture.md) | Hub: package tiers, placement cheat sheet, links to deep chapters |
| [docs/architecture/](docs/architecture/overview.md) | Under-the-hood chapters (runtime, workbench, canvas, html, studio, extensions) |
| [docs/architecture/packages-and-api.md](docs/architecture/packages-and-api.md) | Package map, public exports, who imports what, pre-1.0 stability |
| [Plugin-boundaries.md](Plugin-boundaries.md) | Internal vs external plugins, protocol trust boundary, cloud/marketplace runners |
| [FEATURES.md](FEATURES.md) | Product capability matrix, Polotno gap tracking, what we should still offer |
| [apps/docs/README.md](apps/docs/README.md) | Extension authoring hub — internal vs sandbox vs embed |
| [apps/docs/extension-guide.md](apps/docs/extension-guide.md) | Internal OOP plugin author API |
| [apps/docs/sandbox-extension-guide.md](apps/docs/sandbox-extension-guide.md) | Sandbox widgets/plugins + embed panels |
| [docs/architecture/property-fields.md](docs/architecture/property-fields.md) | Inspector `PropertyFieldDescriptor`, field kinds, `layout` |
| [packages/canvas/README.md](packages/canvas/README.md) | Canvas install and `CanvasPlugin` |
| [packages/workbench/Design.md](packages/workbench/Design.md) | Workbench **visual design** tokens only (not API docs) |

Read **Architecture.md** (and the relevant `docs/architecture/*` chapter) before placing new code. Read **Plugin-boundaries.md** when touching embed/sandbox/external plugins. Update **FEATURES.md** when adding or removing a user-facing editor capability. When unsure, load the global **openenvx** skill (`~/.cursor/skills/openenvx`).

### Documentation vs design reference

- **`docs/architecture/*.md`** and package READMEs — **authoritative API and behavior** for agents and integrators. Add or update a chapter when you introduce or change a public descriptor, contribution, or host contract.
- **[packages/workbench/Design.md](packages/workbench/Design.md)** — **editor shell look-and-feel** (colors, density, component visuals). Do **not** put API tables, prop reference, or integration guides there; link to `docs/architecture/` instead.
- **JSDoc** — Public types in `@openenvx/core` and other libraries should document non-obvious fields on interfaces (especially contribution and descriptor props). Keep JSDoc in sync when you change the type; mirror substantive behavior in architecture docs when authors need narrative context.

## Package placement (hard rules)

| Put it here | Examples |
| --- | --- |
| `@openenvx/core` | Scene (`./schema`), preview IR (`./preview`), `Command`, `Plugin`, `EditorRuntime`, `WorkbenchController`, workbench contributions, `./react` |
| `@openenvx/canvas` | Konva stage, interactions, layer renderers, `CanvasPlugin`, `CanvasEditor`, `CanvasHostProvider` |
| `@xmazu/openenvxee-extensions` | Sandbox author SDK: `./protocol`, element subpaths, `defineExtension`, Vite (`@xmazu/openenvxee-extensions/protocol` for hosts) |

### Canvas rule (non-negotiable)

**All canvas rendering and interactions go in `@openenvx/canvas`.** Never add canvas implementations to `core`.

| Do | Don't |
| --- | --- |
| Add a Konva renderer in `packages/canvas/src/renderers/` | Add canvas renderer types to `core` |
| Register renderers via `registerCanvasContribution()` | Hardcode preview `kind` switches in app shell |
| Use `CanvasEditor` + `CanvasHostProvider` in the app shell | Put workbench-aware editor pane wiring in `@openenvx/canvas` |
| Use `CanvasPlugin` for built-in canvas features | Create app-only canvas plugins without registering contributions |

## Licensing / publishing intent

Internal workspace libraries (`core`, `canvas`, `workbench`, `agent`, …) are **private** and not published. Their `exports` point at **TypeScript `src/`** so Vite/Bun apps hot-reload and TypeScript resolves types from source without rebuilding.

Published packages:

- **`@xmazu/openenvxee-extensions`** — published sandbox author SDK: `./protocol`, `/canvas` `/html` `/panel`, `defineExtension`, Vite. Hosts import **`@xmazu/openenvxee-extensions/protocol`** only.
- **`@xmazu/openenvxee-html-studio`** — published HTML host package (inlines private core/html/workbench). Subpaths: `.`, `./runtime`, `./theme.css`. See [PUBLISHING.md](PUBLISHING.md).
- **`@openenvx/canvas-studio`** — private curated canvas host surface. Monorepo hosts use workspace TypeScript (not published).
- **`@openenvx/html-studio`** — private HTML host surface. External hosts use `@xmazu/openenvxee-html-studio`.

## Host sidebar panels (product hosts)

Product apps (dashboard Studio, embed host) register host sidebars the **VS Code way**: declare contributions; the workbench shell renders. Do **not** mount React panel views from the product host.

| VS Code | OpenEnvx |
| --- | --- |
| `contributes.viewsContainers` | `ViewContainerContribution` |
| `contributes.views` | `ViewContribution` (`when`, order, container) |
| `when` / context keys | Existing `when` strings (`scene.layerSelected`, …) |
| `registerTreeDataProvider` | `ctx.registerTreeDataProvider` (data only) |
| Settings / properties form | `ViewContribution.buildProperties()` → `createPropertyPane` + field kinds + `PropertyPath` |
| `viewsWelcome` | `emptyMessage` on a view (often with `when: '!scene.layerSelected'`) |
| WebviewView | `registerViewPanel` — **only** non-form surfaces (chat, version history, template data) |

**Hard rules:**

- Form/settings panels: `WorkbenchPlugin` + `registerWorkbench(container, ...views)` with `buildProperties` / `emptyMessage` / `when`. Zero React panel components in the host.
- Product hosts: use `ViewContribution.buildProperties()` only. `PropertyPaneContribution` is for **built-in** workbench plugins (e.g. canvas transform panes) merged into the default **Inspector** container — not for embed/dashboard hosts.
- **Naming:** **Inspector** = the default secondary container (`workbench.inspector`) and the canvas layer/node property views it hosts. Generic form content is a `properties` view + `PropertyPane` / `PropertyPath` / `PropertyHostContext` (any container). Headless `createPropertyHostContext` resolves `layerProp` / `templatePolicy` paths; canvas hosts pass `createCanvasPropertyHostContext` for transform and page bleed/safe paths.
- Do **not** import or compose `ViewPane` / `PropertyContentRenderer` from the host (they are shell-internal).
- Before adding a new primitive: inventory published exports and call sites; prefer reuse; only then extend core.
- Embed **policy/data API** (scene commands, schema fields, path context) stays in editor-core; embed **product panels** (e.g. Embed Options) live in the product host (`studio-host`), not in canvas Inspector contributions.

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

- Follow **SOLID**, **KISS**, **YAGNI**, and clean-code principles on every change. Prefer the smallest design that solves the real problem; delete dead paths instead of layering workarounds.
- Prefer known **design patterns** already used in this repo (contributions, registries, property paths, strategy/adapters at trust boundaries) over inventing new frameworks. Extract a shared helper once when two call sites share real logic — do not couple unrelated modules.
- **Loose coupling:** a feature module must not reach into another feature’s internals. Cross features via public package exports, contribution APIs,events, or narrow adapters (e.g. DOM markers / pure geometry), never by importing shell/renderer code into content chrome or vice versa.
- Minimize scope — smallest correct diff.
- Match surrounding naming, types, and patterns.
- Do not over-abstract or add tests that only assert the obvious.

## Editor diagnostics

One **global** diagnostics gate for the whole editor (`WorkbenchControllerOptions.debug`, `localStorage` key `openenvx:debug`, `api.setEditorDebug`). Apps typically pass `debug: import.meta.env.DEV` when creating the controller; users can force on/off with `localStorage`.

When implementing or debugging **runtime-visible behavior** (property layout `when`, context keys, `PropertyPath` resolution, contribution visibility), wire actionable **console diagnostics** via `editorDiagnosticLog` / `isEditorDiagnosticsEnabled()` — do not rely on silent falsy expressions. If a feature “does not work”, enable diagnostics and read `[OpenEnvx]` console groups before guessing.

Details: [docs/architecture/workbench-and-headless.md](docs/architecture/workbench-and-headless.md) (diagnostics), [property-fields.md](docs/architecture/property-fields.md) (property `when`).

## Common tasks

| Task | Where |
| --- | --- |
| Add canvas layer type | `packages/canvas/src/layers/` + register in `CanvasPlugin` |
| Add custom preview `kind` | Canvas contribution class + `registerCanvasContribution(ctx, …)` |
| Add shell UI chrome | `apps/demo-playground/src/` or your own app |
| Wire canvas editor to workbench | App shell: `CanvasHostProvider` + `AbsoluteEditorPane` (see `apps/demo-playground`) |
| Add generic plugin contribution | `packages/core` contribution + `ctx.register()` |
| Add workbench UI contribution | `@openenvx/core` + `ctx.registerWorkbench()` via `WorkbenchPlugin` |
| Add flow layer type | `packages/canvas/src/layers/` |

## Commands

```bash
bun install
bun run test          # all packages
bun run build         # all packages (CI gate)
bun run dev:playground
bun run fix           # auto-fix lint/format (ultracite)
bun run check         # lint (ultracite) + knip
bun run check-types   # tsc --noEmit across packages (excl. apps)
bun run precommit     # ultracite + knip + check-types for packages dirty vs HEAD (excl. apps)
bun run changeset     # create a release changeset
```

## Publishing

Only `packages/extensions` (`@xmazu/openenvxee-extensions`) and `packages/openenvxee-html-studio` (`@xmazu/openenvxee-html-studio`) are published (see [PUBLISHING.md](PUBLISHING.md)).

## Before you finish

After all code changes for the task are done, **always** run these from the repo root and fix every failure before stopping:

1. `bun run fix` — apply Ultracite auto-fixes
2. `bun run precommit` — `check` (ultracite + knip) + Turbo `check-types` for packages changed vs `HEAD` (and their dependents), excluding `apps/*`. Full-repo gate is `bun run build && bun run test` (what CI runs).

If either command fails, fix the reported errors, then re-run both until they pass. Do not leave lint, format, knip, build, or test failures unresolved.

Also verify:

- [ ] No new canvas code under `packages/core`
- [ ] New files use kebab-case
- [ ] No `I`-prefixed interface or type alias names
- [ ] No backward-compat shims for removed APIs
- [ ] Architecture or extension docs updated if you changed package boundaries or plugin APIs
- [ ] Public descriptor/contribution types have JSDoc when props are non-obvious; API behavior belongs in `docs/architecture/`, not `packages/workbench/Design.md`
- [ ] [FEATURES.md](FEATURES.md) updated if you added, removed, or materially changed a user-facing editor capability
