# Packages & public API

**Audience:** Contributors and integrators. Package map, export surface, and stability rules.

Hub: [Architecture.md](../../Architecture.md) · How pieces connect: [overview.md](overview.md) · Publish: [PUBLISHING.md](../../PUBLISHING.md).

## Dependency direction (do not invert)

```text
extensions (protocol subpath)
        │
        ▼
@openenvx/studio/core  (schema + preview + runtime + workbench controller)
        │
        ├── canvas / html / email / agent
        ▼
@openenvx/studio  (React shell entry)
        ▲
        └── host app wires shell + artboard ./workbench presets
```

Hard rules:

- **Canvas never imports `@openenvx/studio` (shell).** `create-canvas-sandbox-extension-host.ts` wires canvas into sandbox (optional; needs `@openenvx/editor-sandbox`; not on the main barrel — avoids a package cycle with `editor-sandbox`).
- **HTML never depends on `@openenvx/canvas-driver`.**
- **Email** (`@openenvx/email-driver`) may depend on `@openenvx/html-driver` for shared block machinery; engine entries must not depend on workbench.
- **Hosts prefer `@openenvx/studio` + driver `default*Workbench`**, not a hand-wired private stack (unless custom shell - see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world - protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host | `@openenvx/studio` + `@openenvx/canvas-driver` (`defaultCanvasWorkbench`) or `@openenvx/studio/internal` (monorepo HMR) |
| HTML product host | `@openenvx/studio` + `@openenvx/html-driver` (`defaultHtmlWorkbench`) or `@openenvx/studio/internal` (monorepo HMR) |
| Email product host | `@openenvx/studio` + `@openenvx/email-driver` (`defaultEmailWorkbench`) or `@openenvx/studio/internal` (monorepo) |
| Custom shell / playground | `@openenvx/studio/core` + `@openenvx/studio` (+ canvas or html) |
| Sandbox widget / plugin author | `@openenvx/editor-sandbox` |
| Scene / preview / Render IR | `@openenvx/studio/schema`, `@openenvx/studio/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@openenvx/studio` | yes | Shell + headless runtime | `.`, `./theme.css`, `./core`, `./schema`, `./preview`, `./react` |
| `@openenvx/canvas-driver` | yes | Konva engine + published `.` preset surface | `.`, `./theme.css`, `./fonts.css` |
| `@openenvx/html-driver` | yes | HTML blocks + published `.` preset surface | `.`, `./theme.css` |
| `@openenvx/email-driver` | yes | Email blocks + published `.` preset surface | `.`, `./theme.css` |
| `@openenvx/editor-sandbox` | yes | Author SDK | `.`, `./protocol`, `./host`, … |
| `@openenvx/studio/plugins/variables` | workspace | Variables plugin | `.`, `./tiptap` |
| `@openenvx/agent` | workspace | Agent chat sidebar | `.`, `./schemas` |

## Public API by package

### Published

**`@openenvx/studio`** - `.`: `WorkbenchShell` + `./theme.css`. `./core`, `./schema`, `./preview`, `./react`: plugin host, scene store, workbench controller, contributions. `./internal` (workspace only): full shell barrel for monorepo plugins. No artboard plugins on `.`.

**`@openenvx/canvas-driver`** - npm `.` + `./theme.css` + `./fonts.css` (artboard editor surface; not the workbench shell). Workspace `.` (`src/index.ts`) is the full engine API; Node PDF uses `exportCanvasDocumentNode`. Hosts also import `@openenvx/studio/theme.css`.

**`@openenvx/html-driver`** - npm `.` + `./theme.css`. Workspace `.` is the full block editor API.

**`@openenvx/email-driver`** - npm `.` + `./theme.css`. Workspace `.` is the full email editor API.

**`@openenvx/editor-sandbox`** - protocol, host, canvas-widget, element subpaths.

### Workspace-only

**`@openenvx/studio/internal`** - workspace-only shell barrel; npm hosts use `@openenvx/studio` + driver `./workbench` or `.`.

**`@openenvx/studio/plugins/variables`** - `VariablesPlugin`; included in `default*Workbench.plugins`.

## Stability rules (pre-1.0)

| Surface | Stability expectation |
| --- | --- |
| **Published** (`studio`, `canvas`, `html`, `email`, `editor-sandbox`) | External contract. Prefer additive changes. Bump version on every publish. |
| **Studio host allowlist** (`packages/studio/src/index.ts`) | Host apps depend on this list. |
| **Private workspace libs** (`variables`, …) | Free to break inside the monorepo in one PR. |
| **Scene JSON / protocol wire** | Highest external cost. |
