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
        └── artboard ./studio presets connect shell + engine
```

Hard rules:

- **Canvas never imports workbench.** `./studio/sandbox-host` wires canvas into sandbox via `createCanvasSandboxExtensionHost` (optional; needs `@openenvx/editor-sandbox`).
- **HTML never depends on `@openenvx/canvas-driver`.**
- **Email** (`@openenvx/email-driver`) may depend on `@openenvx/html-driver` for shared block machinery; engine entries must not depend on workbench.
- **Hosts prefer `@openenvx/studio` + artboard `./studio`**, not a hand-wired private stack (unless custom shell - see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world - protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host | `@openenvx/studio` + `@openenvx/canvas-driver/studio` or `@openenvx/canvas-driver` + `@openenvx/studio/internal` (monorepo HMR) |
| HTML product host | `@openenvx/studio` + `@openenvx/html-driver/studio` or `@openenvx/html-driver` + `@openenvx/studio/internal` (monorepo HMR) |
| Email product host | `@openenvx/studio` + `@openenvx/email-driver/studio` or `@openenvx/email-driver` + `@openenvx/studio/internal` (monorepo) |
| Custom shell / playground | `@openenvx/studio/core` + `@openenvx/studio` (+ canvas or html) |
| Sandbox widget / plugin author | `@openenvx/editor-sandbox` |
| Scene / preview / Render IR | `@openenvx/studio/schema`, `@openenvx/studio/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@openenvx/studio` | yes | Shell + headless runtime | `.`, `./theme.css`, `./core`, `./schema`, `./preview`, `./react` |
| `@openenvx/canvas-driver` | yes | Konva engine + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime`, `./export`, … |
| `@openenvx/html-driver` | yes | HTML blocks + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime` |
| `@openenvx/email-driver` | yes | Email blocks + `./studio` drop-in + `./runtime` | `.`, `./studio`, `./runtime` |
| `@openenvx/editor-sandbox` | yes | Author SDK | `.`, `./protocol`, `./host`, … |
| `@openenvx/variables` | workspace | Variables plugin | `.`, `./tiptap` |
| `@openenvx/agent` | workspace | Agent chat sidebar | `.`, `./schemas` |

## Public API by package

### Published

**`@openenvx/studio`** - `.`: `WorkbenchShell` + `./theme.css`. `./core`, `./schema`, `./preview`, `./react`: plugin host, scene store, workbench controller, contributions. `./internal` (workspace only): full shell barrel for monorepo plugins. No artboard plugins on `.`.

**`@openenvx/canvas-driver`** - `.`: engine API. `./studio`: `CanvasEditor`, `defaultCanvasStudio`. `./studio/sandbox-host`: `createCanvasSandboxExtensionHost`. `./runtime`: `createCanvasScene`, opaque `Scene`. `./export`, `./fonts.css`, `./theme.css`.

**`@openenvx/html-driver`** - `.`: engine API. `./studio`: `HtmlEditor`, `defaultHtmlStudio`, `createHtmlSandboxExtensionHost`. `./runtime`: `createHtmlScene`, `renderBlockDocument`, block registry.

**`@openenvx/email-driver`** - `.`: engine API. `./studio`: `EmailEditor`, `defaultEmailStudio`. `./runtime`: `createEmailScene`, `renderEmailHtml`, opaque `Scene`.

**`@openenvx/editor-sandbox`** - protocol, host, canvas-widget, element subpaths.

### Workspace-only

**`@openenvx/studio/internal`** - workspace-only shell barrel; npm hosts use `@openenvx/studio` + driver `./studio`.

**`@openenvx/variables`** - `VariablesPlugin`; inlined into artboard `./studio` presets.

## Stability rules (pre-1.0)

| Surface | Stability expectation |
| --- | --- |
| **Published** (`studio`, `canvas`, `html`, `email`, `editor-sandbox`) | External contract. Prefer additive changes. Bump version on every publish. |
| **Studio host allowlist** (`packages/studio/src/index.ts`) | Host apps depend on this list. |
| **Private workspace libs** (`variables`, …) | Free to break inside the monorepo in one PR. |
| **Scene JSON / protocol wire** | Highest external cost. |
