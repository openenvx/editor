# Packages & public API

**Audience:** Internal engineers and coding agents. Package map, export surface, and stability rules.

Hub: [Architecture.md](../../Architecture.md) · How pieces connect: [overview.md](overview.md) · Publish: [PUBLISHING.md](../../PUBLISHING.md).

This chapter answers: **what each package owns**, **what hosts/plugins should import**, and **what counts as a breaking change** before 1.0.

## Where responsibilities already live

| Need | Doc |
| --- | --- |
| Tiers + placement cheat sheet | [Architecture.md](../../Architecture.md) |
| Mental model / layer stack | [overview.md](overview.md) |
| Core runtime | [runtime-and-core.md](runtime-and-core.md) |
| Headless vs workbench shell | [workbench-and-headless.md](workbench-and-headless.md) |
| Canvas / HTML / email engines | [canvas.md](canvas.md) · [html.md](html.md) · [driver-email.md](driver-email.md) |
| What product hosts import | [studio-and-products.md](studio-and-products.md) |
| How to author an extension | [extensions.md](extensions.md) · [extensions-sandbox-guide.md](extensions-sandbox-guide.md) |

## Dependency direction (do not invert)

```text
extensions (protocol subpath)
        │
        ▼
      core  (schema + preview + runtime + workbench controller)
        │
        ├── canvas / html / driver-email / agent
        ▼
   workbench (React shell) ◄── canvas-studio / html-studio (fat re-exports)
```

Hard rules:

- **Canvas never imports workbench.** Studio wires canvas into sandbox via `createSandboxExtensionHost`.
- **HTML never depends on `@openenvx/canvas`.**
- **Email driver** (`@openenvx/driver-email`) may depend on `@openenvx/html` for shared block machinery; it must not depend on canvas / workbench (command Sheets are hosted by the shell via `sheetOpenKey` + `registerViewPanel`).
- **Hosts prefer studio / html-studio**, not a hand-wired private stack (unless custom shell — see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world — protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host (dashboard, embed) | `@openenvx/canvas-studio` (monorepo; `packages/studio` is private) |
| HTML product host | `@xmazu/openenvxee-html-studio` (published) or `@openenvx/html-studio` (monorepo) |
| Custom shell / playground | `@openenvx/core` (+ canvas or html) |
| In-repo **internal** plugin author | `@openenvx/core` — [extensions-host-guide.md](extensions-host-guide.md) |
| **Sandbox** widget / plugin author | `@xmazu/openenvxee-extensions` — [extensions-sandbox-guide.md](extensions-sandbox-guide.md) |
| Scene / preview / Render IR (in-monorepo) | `@openenvx/core/schema`, `@openenvx/core/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@xmazu/openenvxee-extensions` | yes | Author SDK: `./protocol`, `/canvas` `/html` `/panel`, `defineExtension`, Vite | `.`, `./protocol`, … |
| `@openenvx/core` | private | Scene Zod (`./schema`), preview IR (`./preview`), `EditorRuntime`, `WorkbenchController`, contributions | `.`, `./schema`, `./preview`, `./react` |
| `@openenvx/canvas` | private | Konva engine, layers, `CanvasPlugin`, `CanvasEditor`, canvas workbench chrome | `.` (+ export/registry subpaths) |
| `@openenvx/html` | private | HTML blocks, `HtmlBlocksPlugin`, `HtmlEditorPane`, `renderBlockDocument` | `.`, `./runtime` |
| `@openenvx/driver-email` | private | Email blocks (React-Email), `EmailBlocksPlugin`, `renderEmailDocument` | `.` |
| `@openenvx/workbench` | private | `WorkbenchShell`, field renderers, sandbox host | `.`, `./theme.css` |
| `@openenvx/agent` | private | Agent chat sidebar plugin | `.`, `./schemas` |
| `@openenvx/canvas-studio` | private | Curated canvas host API (workspace TS, not bundled) | `.`, `./theme.css`, `./fonts.css` |
| `@openenvx/html-studio` | private | Fat HTML product re-exports + `DEFAULT_HTML_STUDIO_PLUGINS` | `.`, `./theme.css` |
| `@xmazu/openenvxee-html-studio` | yes (restricted, GH Packages) | Per-module publish of html-studio + inlined stack | `.`, `./runtime`, `./theme.css` |

Private packages resolve from TypeScript `src/` in the workspace (HMR). Published packages ship `dist/` — see [PUBLISHING.md](../../PUBLISHING.md).

## Public API by package (host / plugin surface)

Truth is always `packages/*/src/index.ts` (and secondary entries). This section is the **intended** contract — keep indexes narrow; do not grow “everything useful” dumps.

### Published

**`@xmazu/openenvxee-extensions`** — `./protocol`: `RenderNode`, manifests, validators, sandbox grants. `.`: `defineExtension`, `define*Component`, `renderToElementTree`, `renderPanelTree`, `buildGrantFromManifest`. Subpaths: `./canvas` / `./html` / `./panel`, `./vite`, `./openenvx`.

**`@xmazu/openenvxee-html-studio`** — published HTML host surface (inlines private core/html/workbench). Subpaths: `.`, `./runtime`, `./theme.css`.

### Editor backbone (private)

**`@openenvx/core`** — `./schema`: Scene Zod, normalize/validate, templates; `./schema/scene.schema.json` for JSON Schema export. `./preview`: LayerPreviewBuilder, Render IR. `.`: `EditorRuntime`, `PluginManager`, `WorkbenchController`, workbench contributions, property panes (`WorkbenchApi.mountSandboxHost` for sandbox panels). Property layout: `createPropertyPane`, `PropertyPath.when`, `PropertyLayoutWhenOptions`, `evaluatePropertyLayoutWhen`, `isPropertyLayoutNodeVisible`. `./react`: `WorkbenchProvider`, hooks.

**`@openenvx/canvas`** — `CanvasPlugin`, `CanvasTemplatePlugin`, `CanvasEditor` / `CanvasHostProvider` / `CanvasStage`, layer definitions, `registerCanvasContribution`, transform/print panes, align tools, crop/guides, widget mapping helpers, export helpers.

**`@openenvx/html`** — `HtmlBlocksPlugin`, `HtmlEditorPane`, block registry + tree helpers, `createBlockCommands`.

**`@openenvx/driver-email`** — `EmailBlocksPlugin`, `EmailEditorPane`, `renderEmailDocument`, email block registry.

**`@openenvx/agent`** — `AgentChatPlugin`, chat UI contributions; `./schemas` for proposal Zod types.

### Shell (private; selective re-export via studio)

**`@openenvx/workbench`** — `WorkbenchShell`, default chrome/fields/inspector plugins, theme/i18n, `SandboxExtensionHost`, layout helpers.

Canvas-studio re-exports a **fixed allowlist** of workbench symbols — not the entire workbench barrel. See [`packages/canvas-studio/src/index.ts`](../../packages/canvas-studio/src/index.ts).

### Product fat bundles

**`@openenvx/canvas-studio`** — curated host allowlist (`WorkbenchShell`, `DEFAULT_STUDIO_PLUGINS`, layout/property helpers, sandbox/embed, theme CSS). Workspace TypeScript via `workspace:*` — monorepo hosts use this.

**`@openenvx/html-studio`** — private HTML fat package (`export *` core/html + selective workbench + `DEFAULT_HTML_STUDIO_PLUGINS`).

## Not public (do not import from hosts)

| Symbol / area | Why |
| --- | --- |
| `ViewPane`, `PropertyContentRenderer` | Shell-internal renderers — not in studio/workbench public indexes |
| Deep `workbench/src/layout/*` paths | Bypass the contribution model |
| QuickJS isolate internals | Use `SandboxExtensionHost` / studio factory only |
| Ad-hoc scene store writes from UI | Commands are the mutation hub |

Product hosts declare UI via `ViewContribution.buildProperties()` / `emptyMessage` / `when`. Use `registerViewPanel` only for non-form surfaces (chat, version history, …).

## Stability rules (pre-1.0)

Packages are pre-1.0: breaking changes are allowed and preferred over shims ([AGENTS.md](../../AGENTS.md)). Stability still means **predictable contracts** for the people who depend on us.

| Surface | Stability expectation |
| --- | --- |
| **Published** (`extensions`, `openenvxee-html-studio`) | Treat as the external contract. Prefer additive changes. Document removals/renames in the PR / changeset. Bump version on every publish. |
| **Studio host allowlist** (`packages/canvas-studio/src/index.ts`) | Host apps depend on this list. Adding is fine; removing/renaming is a host break — update openenvx-cloud / embed hosts in the same change window. |
| **Private workspace libs** (`core`, `canvas`, …) | Free to break inside the monorepo in one PR (update all callers). Do **not** add deprecated dual paths. |
| **Contribution class hierarchy** (`Plugin`, `Command`, `LayerDefinition`, workbench contributions) | Highest-value internal API. Change carefully; update extension-guide when the authoring shape moves. |
| **Scene JSON / protocol wire** | Highest external cost. Schema/protocol changes need consumer awareness (cloud export, agents, embeds). |

### Practical checklist before changing an export

1. Is it in a **published** package or the **studio allowlist**? If yes, treat as a product break.
2. Grep callers across the monorepo (and known product repos when published).
3. Update this chapter if you add/remove a package, entry point, or major public symbol group.
4. Update [FEATURES.md](../../FEATURES.md) when user-facing editor capability changes.
5. No backward-compat shims — replace in place and fix callers.

### Keeping this doc honest

When `packages/*/src/index.ts` drifts from this chapter, **fix the chapter** (or narrow the index). Do not grow silent public surface. Prefer studio’s selective workbench exports over `export *` from workbench.
