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
| Trust (embed / sandbox) | [extensions.md](extensions.md) · [Plugin-boundaries.md](../../Plugin-boundaries.md) |
| How to author an extension | [apps/docs/README.md](../../apps/docs/README.md) (pick path) |

## Dependency direction (do not invert)

```text
schema / preview / protocol
        │
        ▼
      core
        │
        ▼
    headless ──────────────────────────────┐
        │                                  │
        ├── canvas / html / driver-email / agent
        │       │                          │
        │       └── canvas-pro             │
        ▼                                  ▼
   workbench (React shell) ◄── studio / html-studio (fat re-exports)
```

Hard rules:

- **Canvas never imports workbench.** Studio wires canvas into sandbox via `createSandboxExtensionHost`.
- **HTML never depends on canvas-pro.**
- **Email driver** (`@openenvx/driver-email`) may depend on `@openenvx/html` for shared block machinery; it must not depend on canvas / canvas-pro.
- **Hosts prefer studio / html-studio**, not a hand-wired private stack (unless custom shell — see `apps/demo-playground`).
- **Untrusted code** never loads in the editor main world — protocol trees + sandbox Worker only.

## Who imports what

| Consumer | Prefer importing |
| --- | --- |
| Canvas product host (dashboard, embed) | `@openenvx/studio` |
| HTML product host | `@openenvx/html-studio` |
| Custom shell / playground | `@openenvx/core` + `@openenvx/headless` (+ canvas or html) |
| In-repo **internal** plugin author | `core` + `headless` contributions; canvas APIs from `@openenvx/canvas` — [extension-guide.md](../../apps/docs/extension-guide.md) |
| **Sandbox** widget / plugin author | `@openenvx/widget-sdk` + `@openenvx/elements` — [sandbox-extension-guide.md](../../apps/docs/sandbox-extension-guide.md) |
| Embed parent author | protocol (+ elements `/panel` + widget-sdk `renderPanelTree`) — [sandbox-extension-guide.md](../../apps/docs/sandbox-extension-guide.md#embed-panels) |
| Scene / export / LLM schemas | `@openenvx/schema` (+ preview / protocol as needed) |

## Package catalog

| Package | Publish | Owns | Entry points |
| --- | --- | --- | --- |
| `@openenvx/schema` | yes | Scene Zod model, normalize/validate, template helpers | `.`, `./scene.schema.json` |
| `@openenvx/preview` | yes | Layer preview descriptors, Render IR types | `.` |
| `@openenvx/protocol` | yes | `RenderNode`, manifests, validators, sandbox grants/messages | `.` |
| `@openenvx/elements` | yes | Preact element vocabulary (`/canvas` `/html` `/panel`) | `.`, `./canvas`, `./html`, `./panel`, jsx runtimes |
| `@openenvx/widget-sdk` | yes | `defineExtension` / `define*Component`, props, `renderToElementTree`, Vite packaging, ambient `openenvx` | `.`, `./vite`, `./openenvx` |
| `@openenvx/core` | private | `EditorRuntime`, `PluginManager`, commands, layers, DI, scene store | `.` |
| `@openenvx/headless` | private | `WorkbenchController`, UI contribution descriptors, property host, `ExternalHostMount` | `.`, `./react` |
| `@openenvx/canvas` | private | Konva engine, layers, `CanvasBasicsPlugin`, `CanvasEditor` | `.` (+ export/registry subpaths) |
| `@openenvx/html` | private | HTML blocks, `HtmlBlocksPlugin`, `HtmlEditorPane` | `.` |
| `@openenvx/driver-email` | private | Email blocks (React-Email), `EmailBlocksPlugin`, `renderEmailDocument` | `.` |
| `@openenvx/workbench` | private | `WorkbenchShell`, field renderers, sandbox/embed hosts | `.`, `./theme.css` |
| `@openenvx/canvas-pro` | private | Canvas-only chrome (zoom, transform panes, floating toolbar) | `.` |
| `@openenvx/agent` | private | Agent chat sidebar plugin | `.`, `./schemas` |
| `@openenvx/studio` | yes (restricted) | Fat canvas product: re-exports stack + `DEFAULT_STUDIO_PLUGINS` + sandbox factory | `.`, `./theme.css`, `./fonts.css` |
| `@openenvx/html-studio` | private | Fat HTML product re-exports + `DEFAULT_HTML_STUDIO_PLUGINS` | `.`, `./theme.css` |

Private packages resolve from TypeScript `src/` in the workspace (HMR). Published packages ship `dist/` — see [PUBLISHING.md](../../PUBLISHING.md).

## Public API by package (host / plugin surface)

Truth is always `packages/*/src/index.ts` (and secondary entries). This section is the **intended** contract — keep indexes narrow; do not grow “everything useful” dumps.

### Published foundation

**`@openenvx/schema`** — `Scene` / `Page` / `Layer` types; `normalizeScene` / `validateScene` / `createEmptyScene*`; template (`applyModifications`, …); units; Zod schemas; `SCHEMA_VERSION`.

**`@openenvx/preview`** — `LayerPreviewBuilder`; Render IR document/node types; IR guards; `RENDER_IR_VERSION`.

**`@openenvx/protocol`** — `RenderNode` / manifest types; `WidgetFaceRenderResult` / `WidgetRegistryEntry`; `validateRenderTree` / `validatePluginTree` / `validateWidgetTree` / `validateExtensionManifest`; sandbox grants + host/parent message unions.

**`@openenvx/elements`** — Preact canvas/HTML/panel intrinsics only.

**`@openenvx/widget-sdk`** — `defineExtension`, `defineCanvasComponent` / `defineHtmlComponent`, `renderToElementTree`, `renderPanelTree`, `buildGrantFromManifest`; Vite `bundleWidgetSources` via `./vite`; isolate ambient via `./openenvx`.

### Editor backbone (private; re-exported by studio)

**`@openenvx/core`** — `EditorRuntime`, `Plugin` / `PluginManager`, `Command`, `LayerDefinition`, `SceneStore`, `PropertyBuilder`, contribution bases, DI / services, `ScenePlugin`.

**`@openenvx/headless`** — `WorkbenchController`, `WorkbenchPlugin`, contribution classes (Toolbar, View, PropertyPane, …), builders, `createPropertyPane` / `createPropertyHostContext`, layout + `ExternalHostMount`. React bridge: `@openenvx/headless/react` (`WorkbenchProvider`, hooks).

**`@openenvx/canvas`** — `CanvasBasicsPlugin`, `CanvasEditor` / `CanvasHostProvider` / `CanvasStage`, layer definitions, `registerCanvasContribution`, widget mapping helpers, export helpers.

**`@openenvx/html`** — `HtmlBlocksPlugin`, `HtmlEditorPane`, block registry + tree helpers, `createBlockCommands`.

**`@openenvx/driver-email`** — `EmailBlocksPlugin`, `EmailEditorPane`, `renderEmailDocument`, email block registry.

**`@openenvx/canvas-pro`** — `CanvasProPlugin`, `DEFAULT_CANVAS_PRO_PLUGINS`, transform/print panes, align tools, crop/guides.

**`@openenvx/agent`** — `AgentChatPlugin`, chat UI contributions; `./schemas` for proposal Zod types.

### Shell (private; selective re-export via studio)

**`@openenvx/workbench`** — `WorkbenchShell`, default chrome/fields/inspector plugins, theme/i18n, `SandboxExtensionHost` / `EmbedPanelHost`, layout helpers.

Studio re-exports a **fixed allowlist** of workbench symbols (shell + hosts + default plugins) — not the entire workbench barrel. See [`packages/studio/src/index.ts`](../../packages/studio/src/index.ts).

### Product fat bundles

**`@openenvx/studio`** — `export *` from core, headless, canvas, canvas-pro, agent; selective workbench surface; `DEFAULT_STUDIO_PLUGINS`; `createSandboxExtensionHost()`.

**`@openenvx/html-studio`** — same pattern for HTML (`export *` core/headless/html + selective workbench + `DEFAULT_HTML_STUDIO_PLUGINS`).

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
| **Published** (`schema`, `preview`, `protocol`, `elements`, `widget-sdk`, `studio`) | Treat as the external contract. Prefer additive changes. Document removals/renames in the PR / changeset. Bump version on every publish. |
| **Studio re-export allowlist** (workbench symbols in `studio/src/index.ts`) | Host apps depend on this list. Adding is fine; removing/renaming is a host break — update openenvx-cloud / embed hosts in the same change window. |
| **Private workspace libs** (`core`, `headless`, `canvas`, …) | Free to break inside the monorepo in one PR (update all callers). Do **not** add deprecated dual paths. |
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
