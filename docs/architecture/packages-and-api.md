# Packages & public API

**Audience:** Contributors and integrators. Package map, export surface, and stability rules.

Hub: [Architecture.md](../../Architecture.md) · How pieces connect: [overview.md](overview.md) · Publish: [PUBLISHING.md](../../PUBLISHING.md).

## Dependency direction (do not invert)

```text
extensions (protocol subpath)
        │
        ▼
@openenvx/studio  (headless: schema + preview + runtime + workbench controller)
        │
        ├── canvas / agent
        ▼
@openenvx/studio/shell  (React WorkbenchShell)
        ▲
        └── host app wires shell + canvas ./workbench presets
```

Hard rules:

- **Canvas never imports `@openenvx/studio/shell`.** Drivers use `@openenvx/studio` + `./schema` / `./preview` / `./react`. `create-canvas-sandbox-extension-host.ts` wires canvas into sandbox (optional; needs `@openenvx/editor-sandbox`; not on the main barrel — avoids a package cycle with `editor-sandbox`).
- **Hosts prefer `@openenvx/studio` + `defaultCanvasWorkbench`**, not a hand-wired private stack (unless custom shell - see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world - protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host | `@openenvx/studio/shell` + `@openenvx/canvas-driver` (`defaultCanvasWorkbench`) or `@openenvx/studio/internal` (monorepo HMR) |
| Custom shell / playground | `@openenvx/studio` + `@openenvx/studio/shell` + `@openenvx/canvas-driver` |
| Sandbox widget / plugin author | `@openenvx/editor-sandbox` |
| Scene / preview / Render IR | `@openenvx/studio/schema`, `@openenvx/studio/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@openenvx/studio` | yes | Headless runtime + shell | `.`, `./shell`, `./theme.css`, `./schema`, `./preview`, `./react` |
| `@openenvx/canvas-driver` | yes | Konva engine + published `.` preset surface | `.`, `./theme.css`, `./fonts.css` |
| `@openenvx/editor-sandbox` | yes | Author SDK | `.`, `./protocol`, `./host`, … |
| `@openenvx/studio/plugins/variables` | workspace | Variables plugin | `.`, `./tiptap` |
| `@openenvx/agent` | workspace | Agent chat sidebar | `.`, `./schemas` |

## Public API by package

### Published

**`@openenvx/studio`** - `.`: plugin host, scene store, workbench controller, contributions. `./shell`: `WorkbenchShell` + shell CSS (`./shell.css`, `./styles.css`). `./schema`, `./preview`, `./react`: document model, Render IR, React workbench context. `./internal` (workspace only): full shell barrel for monorepo plugins. No artboard plugins on `.` or `./shell`. **npm `dist/`** is built with [Rolldown](https://rolldown.rs/): browser-bundled ESM with third-party deps inlined; integrators do not mirror Studio’s `dependencies` in the host app.

**`@openenvx/canvas-driver`** - npm `.` + `./theme.css` + `./fonts.css` (artboard editor surface; not the workbench shell). Published `.` bundles engine deps; peers: `@openenvx/studio`, `react`, `react-dom`. Workspace `.` (`src/index.ts`) is the full engine API; Node PDF uses `exportCanvasDocumentNode`. Hosts also import `@openenvx/studio/theme.css`.

**`@openenvx/editor-sandbox`** - protocol, host, canvas-widget, element subpaths.

### Workspace-only

**`@openenvx/studio/internal`** - workspace-only shell barrel; npm hosts use `@openenvx/studio/shell` + driver `.` presets.

**`@openenvx/studio/plugins/variables`** - `VariablesPlugin`; included in `defaultCanvasWorkbench.plugins`.

## Stability rules (pre-1.0)

| Surface | Stability expectation |
| --- | --- |
| **Published** (`studio`, `canvas`, `editor-sandbox`) | External contract. Prefer additive changes. Bump version on every publish. |
| **Studio host allowlist** (`packages/studio/src/shell/index.ts`) | Host apps depend on this list. |
| **Private workspace libs** (`variables`, …) | Free to break inside the monorepo in one PR. |
| **Scene JSON / protocol wire** | Highest external cost. |
