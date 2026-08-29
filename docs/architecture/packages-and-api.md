# Packages & public API

**Audience:** Contributors and integrators. Package map, export surface, and stability rules.

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
   workbench (React shell) ◄── studio / html-studio (fat re-exports)
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
| Canvas product host | `@openenvx/canvas-studio` (published) or `@openenvx/canvas` + `@openenvx/workbench` (custom shell / monorepo HMR) |
| HTML product host | `@openenvx/html-studio` (published) or `@openenvx/html` + `@openenvx/workbench` (monorepo HMR) |
| Email product host | `@openenvx/email-studio` (published) or `@openenvx/driver-email` + `@openenvx/workbench` (monorepo) |
| OSS canvas drop-in | `@openenvx/canvas-studio` (published) |
| Custom shell / playground | `@openenvx/core` (+ canvas or html) |
| In-repo **internal** plugin author | `@openenvx/core` — [extensions-host-guide.md](extensions-host-guide.md) |
| **Sandbox** widget / plugin author | `@xmazu/openenvxee-extensions` — [extensions-sandbox-guide.md](extensions-sandbox-guide.md) |
| Scene / preview / Render IR (in-monorepo) | `@openenvx/core/schema`, `@openenvx/core/preview` |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@xmazu/openenvxee-extensions` | yes | Author SDK: `./protocol`, `/canvas` `/html` `/panel`, `defineExtension`, Vite | `.`, `./protocol`, … |
| `@openenvx/core` | workspace | Scene Zod (`./schema`), preview IR (`./preview`), `EditorRuntime`, `WorkbenchController`, contributions | `.`, `./schema`, `./preview`, `./react` |
| `@openenvx/canvas` | workspace | Konva engine, layers, `CanvasPlugin`, `CanvasEditor`, canvas workbench chrome | `.` (+ export/registry subpaths) |
| `@openenvx/html` | workspace | HTML blocks, `HtmlBlocksPlugin`, `HtmlEditorPane`, `renderBlockDocument` | `.`, `./runtime` |
| `@openenvx/driver-email` | workspace | Email blocks (React-Email), `EmailBlocksPlugin`, `renderEmailDocument`, `renderEmailHtml` | `.`, `./runtime` |
| `@openenvx/workbench` | workspace | `WorkbenchShell`, field renderers, sandbox host | `.`, `./theme.css` |
| `@openenvx/agent` | workspace | Agent chat sidebar plugin | `.`, `./schemas` |
| `@openenvx/canvas-studio` | yes (public, npmjs) | Minified canvas editor (`CanvasEditor`, scene factory) | `.`, `./runtime`, `./theme.css`, `./fonts.css` |
| `@openenvx/html-studio` | yes (public, npmjs) | Minified HTML editor (`HtmlEditor`, host composition API) | `.`, `./runtime`, `./theme.css` |
| `@xmazu/openenvxee-studio` | private | Product-specific canvas host allowlist | `.`, `./theme.css`, `./fonts.css` |
| `@openenvx/email-studio` | yes (public, npmjs) | Minified email editor (`EmailEditor`, scene + HTML export) | `.`, `./runtime`, `./theme.css` |

Private packages resolve from TypeScript `src/` in the workspace (HMR). Published packages ship `dist/` — see [PUBLISHING.md](../../PUBLISHING.md).

## Public API by package (host / plugin surface)

Truth is always `packages/*/src/index.ts` (and secondary entries). This section is the **intended** contract — keep indexes narrow; do not grow “everything useful” dumps.

### Published

**`@xmazu/openenvxee-extensions`** — `./protocol`: `RenderNode`, manifests, validators, sandbox grants. `.`: `defineExtension`, `define*Component`, `renderToElementTree`, `renderPanelTree`, `buildGrantFromManifest`. Subpaths: `./canvas` / `./html` / `./panel`, `./vite`, `./openenvx`.

**`@openenvx/html-studio`** — published HTML editor. Subpaths: `.`, `./runtime`, `./theme.css`. Exports: `HtmlEditor`, `HtmlEditorProps`, host composition API (`WorkbenchShell`, `WorkbenchPlugin`, contributions), `DEFAULT_HTML_STUDIO_PLUGINS`, `createHtmlSandboxExtensionHost`. `./runtime`: `createHtmlScene`, `renderBlockDocument`, `BlockRegistry`, `builtinBlocks`. Wide `.d.ts` for product hosts.

**`@openenvx/email-studio`** — published email editor. Subpaths: `.`, `./runtime`, `./theme.css`. Exports: `EmailEditor`, `EmailEditorProps`, `createEmailScene`, `renderEmailHtml`, `RenderEmailHtmlOptions`, `Scene` (opaque JSON for persistence — not the internal schema). Headless HTML export: `@openenvx/email-studio/runtime`. Published `.d.ts` is handwritten and must stay narrow.

**`@openenvx/canvas-studio`** — published canvas editor. Subpaths: `.`, `./runtime`, `./theme.css`, `./fonts.css`. Exports: `CanvasEditor`, `CanvasEditorProps`, `createCanvasScene`, `Scene` (opaque JSON). Headless scene factory: `@openenvx/canvas-studio/runtime`. No raster export.

### Editor backbone (workspace)

**`@openenvx/core`** — `./schema`: Scene Zod, normalize/validate, templates; `./schema/scene.schema.json` for JSON Schema export. `./preview`: LayerPreviewBuilder, Render IR. `.`: `EditorRuntime`, `PluginManager`, `WorkbenchController`, workbench contributions, property panes (`WorkbenchApi.mountSandboxHost` for sandbox panels). Property layout: `createPropertyPane`, `PropertyPath.when`, `PropertyLayoutWhenOptions`, `evaluatePropertyLayoutWhen`, `isPropertyLayoutNodeVisible`. `./react`: `WorkbenchProvider`, hooks.

**`@openenvx/canvas`** — `CanvasPlugin`, `CanvasTemplatePlugin`, `CanvasEditor` / `CanvasHostProvider` / `CanvasStage`, layer definitions, `registerCanvasContribution`, transform/print panes, align tools, crop/guides, widget mapping helpers, export helpers.

**`@openenvx/html`** — `HtmlBlocksPlugin`, `HtmlEditorPane`, block registry + tree helpers, `createBlockCommands`.

**`@openenvx/driver-email`** — `EmailBlocksPlugin`, `EmailEditorPane`, `renderEmailDocument`, `renderEmailHtml` (`./runtime` is the headless export graph).

**`@openenvx/agent`** — `AgentChatPlugin`, chat UI contributions; `./schemas` for proposal Zod types.

### Shell (private; selective re-export via studio)

**`@openenvx/workbench`** — `WorkbenchShell`, default chrome/fields/inspector plugins, theme/i18n, `SandboxExtensionHost`, layout helpers.

**`@xmazu/openenvxee-studio`** — curated canvas host allowlist (`WorkbenchShell`, `DEFAULT_STUDIO_PLUGINS`, layout/property helpers, sandbox/embed, theme CSS). Source: `packages/studio/src/index.ts`.

**`@openenvx/html-studio`** — published HTML editor (`HtmlEditor`, host composition API, `DEFAULT_HTML_STUDIO_PLUGINS`, sandbox factory). Source: `packages/html-studio/src/index.ts`.

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
| **Published** (`extensions`, `@openenvx/html-studio`, `@openenvx/email-studio`, `@openenvx/canvas-studio`) | Treat as the external contract. Prefer additive changes. Document removals/renames in the PR / changeset. Bump version on every publish. |
| **Studio host allowlist** (`packages/studio/src/index.ts`) | Host apps depend on this list. Adding is fine; removing/renaming is a host break — update openenvx-cloud / embed hosts in the same change window. |
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
