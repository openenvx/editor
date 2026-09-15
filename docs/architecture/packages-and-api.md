# Packages & public API

**Audience:** Contributors and integrators. Package map, export surface, and stability rules.

Hub: [Architecture.md](../../Architecture.md) · How pieces connect: [overview.md](overview.md) · Publish: [PUBLISHING.md](../../PUBLISHING.md).

## Dependency direction (do not invert)

```text
extensions (protocol subpath)
        │
        ▼
      core  (schema + preview + runtime + workbench controller)
        │
        ├── canvas / html / email / agent
        ▼
   workbench (React shell) ◄── @openenvx/studio (published host allowlist)
        ▲
        └── artboard ./studio presets connect shell + engine
```

Hard rules:

- **Canvas never imports workbench.** Artboard `./studio` wires canvas into sandbox via `createCanvasSandboxExtensionHost`.
- **HTML never depends on `@openenvx/canvas-driver`.**
- **Email** (`@openenvx/email-driver`) may depend on `@openenvx/html-driver` for shared block machinery; engine entries must not depend on workbench.
- **Hosts prefer `@openenvx/studio` + artboard `./studio`**, not a hand-wired private stack (unless custom shell - see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world - protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host | `@openenvx/studio` + `@openenvx/canvas-driver/studio` or `@openenvx/canvas-driver` + `@openenvx/workbench` (monorepo HMR) |
| HTML product host | `@openenvx/studio` + `@openenvx/html-driver/studio` or `@openenvx/html-driver` + `@openenvx/workbench` (monorepo HMR) |
| Email product host | `@openenvx/studio` + `@openenvx/email-driver/studio` or `@openenvx/email-driver` + `@openenvx/workbench` (monorepo) |
| Custom shell / playground | `@openenvx/core` + `@openenvx/studio` (+ canvas or html) |
| Sandbox widget / plugin author | `@openenvx/editor-sandbox` |
| Scene / preview / Render IR | `@openenvx/core/schema`, `@openenvx/core/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@openenvx/core` | yes | Scene Zod, runtime, workbench controller | `.`, `./schema`, `./preview`, `./react` |
| `@openenvx/studio` | yes | Workbench host allowlist | `.`, `./theme.css` |
| `@openenvx/canvas-driver` | yes | Konva engine + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime`, `./export`, … |
| `@openenvx/html-driver` | yes | HTML blocks + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime` |
| `@openenvx/email-driver` | yes | Email blocks + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime` |
| `@openenvx/editor-sandbox` | yes | Author SDK | `.`, `./protocol`, `./host`, … |
| `@openenvx/workbench` | workspace | React shell internals | `.` |
| `@openenvx/variables` | workspace | Variables plugin | `.`, `./tiptap` |
| `@openenvx/agent` | workspace | Agent chat sidebar | `.`, `./schemas` |

## Public API by package

### Published

**`@openenvx/core`** - `./schema`, `./preview`, `.`, `./react`. Plugin host, scene store, workbench controller, contributions.

**`@openenvx/studio`** - `WorkbenchShell`, chrome defaults, `SandboxExtensionHost`, `./theme.css`. No artboard plugins.

**`@openenvx/canvas-driver`** - `.`: engine API. `./studio`: `CanvasEditor`, `defaultCanvasStudio`, `createCanvasSandboxExtensionHost`. `./runtime`: `createCanvasScene`, opaque `Scene`. `./export`, `./fonts.css`, `./theme.css`.

**`@openenvx/html-driver`** - `.`: engine API. `./studio`: `HtmlEditor`, `defaultHtmlStudio`, `createHtmlSandboxExtensionHost`. `./runtime`: `createHtmlScene`, `renderBlockDocument`, block registry.

**`@openenvx/email-driver`** - `.`: engine API. `./studio`: `EmailEditor`, `defaultEmailStudio`. `./runtime`: `createEmailScene`, `renderEmailHtml`, opaque `Scene`.

**`@openenvx/editor-sandbox`** - protocol, host, canvas-widget, element subpaths.

### Workspace-only

**`@openenvx/workbench`** - shell internals; use `@openenvx/studio` from npm hosts.

**`@openenvx/variables`** - `VariablesPlugin`; inlined into artboard `./studio` presets.

## Stability rules (pre-1.0)

| Surface | Stability expectation |
| --- | --- |
| **Published** (`core`, `studio`, `canvas`, `html`, `email`, `editor-sandbox`) | External contract. Prefer additive changes. Bump version on every publish. |
| **Studio host allowlist** (`packages/studio/src/index.ts`) | Host apps depend on this list. |
| **Private workspace libs** (`workbench`, `variables`, …) | Free to break inside the monorepo in one PR. |
| **Scene JSON / protocol wire** | Highest external cost. |
