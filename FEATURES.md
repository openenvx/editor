# OpenEnvx feature matrix

Living product capability inventory for the OpenEnvx editor platform. Use this to track what we have, gaps versus Polotno-class canvas SDKs, and what we should still offer to be **better than Polotno**.

Agents: update this file when you add, remove, or materially change a user-facing editor capability. See [AGENTS.md](AGENTS.md).

## Legend

| Status      | Meaning                                                      |
| ----------- | ------------------------------------------------------------ |
| **Done**    | Shipped and usable end-to-end                                |
| **Partial** | Present but incomplete versus Polotno / target UX            |
| **Missing** | Not implemented                                              |
| **Planned** | Explicitly on the backlog as a differentiator or parity item |

| Tier | Meaning |
| --- | --- |
| **OSS** | Available in `@openenvx/core`, `@openenvx/schema`, `@openenvx/canvas`, `@openenvx/headless`, drivers |
| **Pro** | Lives in `@xmazu/openenvxee-canvas-pro`, `@xmazu/openenvxee-studio`, or other closed packages |

## Polotno parity matrix

Baseline competitor: [Polotno SDK](https://polotno.com/) drag-and-drop canvas (zoom/pan, layers, grid, multi-page, bleed/trim, rulers, undo, schema automation).

| Feature | Status | Tier | Where | Gap notes |
| --- | --- | --- | --- | --- |
| Drag-and-drop editing (move / resize) | **Done** | OSS | `packages/canvas/src/canvas-stage-layer.tsx`, `packages/canvas/src/canvas-stage.tsx`, `packages/canvas/src/interactions/layer-transform-strategy.ts`, `packages/canvas/src/commands/canvas-api-commands.ts` | Pixel-level move/resize via Konva + Transformer. |
| Zoom and pan | **Done** | OSS | `packages/canvas/src/viewport.ts`, `packages/canvas/src/commands/canvas-zoom-commands.ts`, `packages/core/src/workbench/editor-viewport-service.ts` | Wheel pan, ctrl/pinch zoom, zoom-to-fit commands. Dedicated pan-tool UX is secondary. |
| Layers panel (organize / reorder / lock / hide) | **Done** | Pro UI + OSS model | `packages/schema` (`visible`, optional `name`), `packages/core/src/plugins/scene-plugin.ts` (`scene.toggleLayerLock`, `scene.toggleLayerVisibility`, `scene.renameLayer`), `packages/canvas-pro` layers panel, canvas stage + export skip hidden | Reorder, lock, hide/show, and inline rename (custom `name` or type label). Hidden layers are non-interactive and omitted from export. |
| Snap to grid / guides / alignment | **Done** | Pro | `packages/canvas-pro/src/snap/smart-guides/`, `packages/canvas/src/snap/grid-snap.ts`, `packages/canvas/src/rulers/`, `packages/canvas-pro/src/stage/smart-guides-stage-interaction.ts`, `packages/canvas-pro/src/commands/align-layers-commands.ts` | Smart guides + align/distribute + snap-to-grid (8px) + user-placed guides (drag from rulers). Guides are session-only (not in schema / undo). |
| Grid controls | **Partial** | OSS + Pro | `packages/canvas` (`CanvasGridSettings`, overlay), studio/canvas-pro toolbar | Overlay + snap toggle (`canvas.toggleGrid`); fixed 8px size. **No grid size picker.** |
| Multi-page / artboards | **Done** | OSS model + Pro UI | `packages/schema` (`Scene.pages`), `packages/core` (`setActivePage`, `scene.addPage` / `removePage` / `duplicatePage` / `renamePage`), `packages/workbench` Pages sidebar (`workbench.pages`) | Multi-page document, switch page, add / delete / duplicate / drag-reorder / inline rename. |
| Bleed and trim | **Done** | OSS | `packages/schema` (`bleedMm` / `safeMm`, `page-print.ts`), `packages/canvas/src/page-margins.ts`, `packages/driver-image/src/crop-marks.ts`, `apps/export-service` | Page size = trim; defaults bleed 3 mm / safe 10 mm on print-eligible pages. Canvas print-guide overlay (safe + bleed edge). SVG/PDF crop marks when bleed > 0; PNG/JPG stay trim-only. |
| Rulers and measurements | **Done** | OSS + Pro | `packages/canvas/src/rulers/`, canvas-pro toolbar (`canvas.toggleRulers`), selection size label + inspector | Top/left rulers with ticks + cursor markers; drag-out guides. |
| Undo / redo history | **Done** | OSS | `packages/core/src/scene/history-stack.ts`, `packages/core/src/scene/scene-store.ts`, `packages/core/src/plugins/scene-plugin.ts` (`scene.undo` / `scene.redo`) | Snapshot history (depth 100). Session-local only — not document version history. |
| Document version history | **Partial** | Pro UI + host provider | `VersionHistoryProvider` (`@openenvx/headless`), `VersionHistoryPlugin` + panel (`@xmazu/openenvxee-workbench`), `versionHistory.restore` | Figma-style list UI + restore. Host implements `listVersions` / `loadVersion`. Create / rename / delete not in the provider contract yet. |
| Declarative embed plugin panels | **Partial** | Pro + protocol | `@xmazu/openenvxee-plugin-protocol`, `PluginPanelPlugin` (`packages/workbench/src/plugin-panel/`) | Parent-hosted JSON trees rendered with Studio primitives. Hosted bundles / dashboard Studio / canvas widgets deferred. |
| Automation and schema control | **Done** | OSS | `packages/schema`, `packages/agent`, `apps/agent-service` | Zod + published JSON Schema; agent proposals mutate scene. Stronger automation story than Polotno alone. |
| Layer types: text / image / shape / video / SVG | **Partial** | OSS | `packages/schema/src/types.ts` (`canvas.rect\|image\|svg\|text\|circle\|group`), `packages/canvas/src/layers/` | Text (rich), image, svg, rect, circle, group: yes. **Video: missing.** Image fit `cover\|contain\|fill` + focal point; text shrink-to-fit via `autoFit`; text box height remasure via `fitCanvasTextLayerToContent` / `applyModificationsWithTextFit`. |
| Fonts and typography | **Done** | OSS | `packages/canvas/src/fonts/`, `FontService` + `canvas.registerFont`, text layer props | Built-in + system fonts; programmatic register (optional remote `src` via `FontFace`). Layer font family / size / fill / align / line height / letter spacing. |
| Rich text editing | **Partial** | OSS | TipTap overlay (`canvas-rich-text-editor.tsx`, `html-rich-text-editor.tsx`), `data.html` | On-canvas and HTML-block bold / italic / underline / strike. **No inline color or per-span font family/size yet.** Shrink-to-fit (`autoFit: 'shrink'`) for fixed-box templated text; otherwise typography/html edits remasure `transform.height` to content. |
| HTML block layout editor | **Partial** | OSS | `packages/html/src/editor/html-editor-pane.tsx`, `block-dnd.ts`, `html.flex` / `html.grid`, `html.hero` | Visual block tree with drag reorder; Flex/Grid hold flat children. Composite blocks use named `data.slots` (atomic in Layers tree). Selection toolbar, double-click text edit. The page frame itself is not selectable on canvas — pick **Page** in Layers for its props. |
| HTML composite / slot blocks | **Done** | OSS | `BlockConfig.slots`, `html.hero`, `html.button`, `slotList` field | Named slots hold real part layers under `data.slots` (not `data.children`). One Layers row; inspector + inline edit of parts; repeatable slots via `slotList`. |
| Curved text | **Done** | OSS | `data.curve`, `rich-text-arc.ts`, Konva `TextPath`, SVG `textPath` export | Arc-amount slider (degrees); whole-block curve (plain text along path). |
| Grouping | **Done** | OSS | `packages/canvas/src/commands/canvas-group-commands.ts`, `packages/canvas/src/scene/group-layers.ts` | Nested groups; layers tree shows children. |
| Rotation / transforms | **Done** | OSS | Schema `rotation` (+ optional `scaleX`/`scaleY`), Konva rotater, `canvas.rotateLeft` / `rotateRight` | Free rotation + box resize. Independent scale tool is not first-class. |
| Lock layers | **Done** | OSS | Schema `locked` / `writeMode`, `scene.toggleLayerLock` | Runtime lock + template writeMode. |
| Export | **Partial** | OSS + service | `packages/canvas/src/export/`, `packages/driver-image`, `apps/export-service` | Client SVG/PNG/JPG; PDF via export-service; page presets mm/dpi. Hidden layers skipped. SVG/PDF include bleed + crop marks when `bleedMm` > 0. **No CMYK/spot-color print pipeline.** |

## Better than Polotno — differentiators

OpenEnvx should not stop at parity. These are existing or planned edges.

### Already ahead (expand)

| Differentiator | Status | Where | Notes |
| --- | --- | --- | --- |
| AI agent automation / scene proposals | **Done** (expand) | `packages/agent`, `apps/agent-service` | Supervisor proposals + Media/ImageGen specialists (Unsplash, Iconify, `canvas.svg`, OpenRouter `gpt-image-2` → R2). |
| Plugin / contribution architecture | **Done** (expand) | `packages/core`, `packages/headless`, `packages/canvas` | Extensible layer types, commands, sidebars, inspectors — not a closed monolith. Primary/secondary view-container locations + content kinds (`tree` / `properties` / `component`) for relocation-ready panes. |
| Secondary sidebar tabs | **Done** | Pro UI (`packages/workbench`, `ViewLocationService`) | Right sidebar Radix tabs; Inspector + Version History as secondary view containers. |
| Headless controller + schema-first | **Done** (expand) | `packages/headless`, `packages/schema`, `packages/core` scene store | Server-safe scene mutation, reproducible JSON, automation without the React shell. |
| Template policy / frozen layers | **Partial** | Schema `writeMode` / lock + template constraints | Constrained editing for marketing templates; deepen policy surface. |
| Dynamic templates / data binding | **Done** | OSS + Pro UI | `packages/schema/src/template.ts` (`extractTemplateManifest`, `applyModifications`, `validateTemplateNames`); canvas `applyModificationsWithTextFit`; canvas-pro Template data panel; contract: [apps/docs/template-api-contract.md](apps/docs/template-api-contract.md) | Bannerbear-style modifications by unique layer `name` (`text`, `imageUrl`, `color`, `fontFamily`, `fontSize`, `hidden`). Shrink-to-fit text **or** remasure text box height to injected copy; image fit/focal point at render time. |
| Composable apps (OSS canvas + custom shell) | **Done** | `apps/demo-playground`, Architecture.md | Hosts own UX; Polotno is more “embed our UI”. |

### Planned advantages (should still offer)

| Differentiator | Status | Target packages | Notes |
| --- | --- | --- | --- |
| Full page CRUD UX | **Done** | `packages/core`, `packages/workbench` | Add / delete / duplicate / rename / reorder pages as first-class commands + Pages sidebar / palette / context menu. |
| Layer visibility | **Done** | `packages/schema`, `packages/core`, canvas-pro layers UI, canvas stage, driver-image export | Schema `visible` + `scene.toggleLayerVisibility` + layers panel eye toggle; hidden layers skipped in render/export. |
| Grid overlay + snap-to-grid | **Done** | `packages/canvas` (+ pro chrome) | Fixed 8px grid; overlay + snap toggle (`canvas.toggleGrid`); smart guides win over grid when both hit. |
| User guides + rulers | **Partial** | `packages/canvas`, `packages/canvas-pro` | Top/left rulers; drag-out guides; snap against guides; `canvas.toggleRulers` / `canvas.clearGuides`. **Session-only** (not schema/history; lost on reload). |
| True bleed / trim / crop marks | **Done** | `packages/schema`, `packages/canvas`, `packages/driver-image`, `apps/export-service` | Schema `bleedMm`/`safeMm`; canvas overlays; SVG/PDF crop marks. No inspector UI yet (defaults + schema). |
| Video layer + timeline | **Planned** | `packages/schema`, `packages/canvas` | First-class `canvas.video` (and later animation timeline). |
| Dedicated SVG layer | **Partial** | `packages/schema`, `packages/canvas`, `packages/driver-image` | `canvas.svg` with markup + optional fill/stroke; Konva via data-URL; vector export. No path editor UI yet. |
| Print pipeline (CMYK / spot) | **Planned** | drivers + export-service | Beyond RGB raster PDF for packaging/print SaaS. |
| Component / instance system | **Planned** | `packages/schema`, `packages/core` | Reusable components across pages — presentation & template scale. |
| Real-time collaboration | **Planned** | core persistence + future collab package | Multiplayer editing for internal design tools. |

## Prioritized backlog

Gaps and differentiators grouped by priority. Implement in separate PRs; update this file when status changes.

### P0 — Polotno parity blockers for a credible design editor

- ~~**Layer visibility**~~ **Done** — schema `visible`; `scene.toggleLayerVisibility`; canvas-pro eye toggle; stage + export skip hidden.
- ~~**Page CRUD**~~ **Done** — `scene.addPage` / `removePage` / `duplicatePage`; Pages sidebar select + drag reorder; palette / context menu.
- ~~**Grid overlay + snap-to-grid**~~ **Done** — `CanvasGridSettings` + `canvas.toggleGrid`; OSS overlay (`kind: 'grid'`) + snap math; pro toolbar; composed with smart guides.
- ~~**Rulers**~~ **Done** — DOM top/left rulers + cursor markers; `canvas.toggleRulers`.

### P1 — Production and media parity

- ~~**User-placed guides**~~ **Partial** — session `CanvasRulerGuidesSettings` per page; drag from rulers; snap via smart guides; `canvas.clearGuides`. **Not persisted / not undoable.**
- ~~**Bleed / trim / crop marks**~~ **Done** — schema `bleedMm` / `safeMm` (defaults 3 mm / 10 mm on print pages); canvas safe + bleed-edge overlays; SVG/PDF crop marks via `driver-image` + export-service (`x-export-bleed-mm`). PNG/JPG trim-only. No inspector UI yet.
- ~~**Dynamic templates / modifications**~~ **Done** — named layers + `applyModifications` / `extractTemplateManifest`; Template data live preview; [template API contract](apps/docs/template-api-contract.md).
- ~~**Text shrink-to-fit**~~ **Done** — `data.autoFit: 'shrink'` + `minFontSize`; `fitFontSize` in canvas + SVG export estimate.
- ~~**Text box fit-to-content**~~ **Done** — `fitCanvasTextLayerToContent` / `applyModificationsWithTextFit` remasure height after injected copy (and on canvas typography edits); skips shrink + curved text.
- ~~**Image fit + focal point**~~ **Done** — `data.fit` (`cover` / `contain` / `fill`) + `focalPoint`; canvas + SVG `preserveAspectRatio`.
- **Video layer** — `canvas.video` in schema + Konva/HTML media renderer in `packages/canvas`.
- ~~**Dedicated SVG layer**~~ **Partial** — `canvas.svg` stores markup (icons/agent SVG); canvas + SVG export. Path/node editor still planned.
- **Hide remaining export gaps** — document DPI in exports; tighten print presets; optional PNG-with-marks flag.

### P2 — Exceed Polotno

- **Deeper AI agent workflows** — richer scene tools, template-aware proposals, batch multi-page generation (`packages/agent` / `apps/agent-service`).
- **Component / instance system** — shared symbols across pages.
- **Animation / video timeline** — beyond static frames.
- **Print color pipeline** — CMYK / spot where product needs it.
- **Real-time collaboration** — shared sessions on schema history.
- **Template policy surface** — first-class frozen regions, brand kits, constrained property sets.

## Maintenance

When changing capabilities:

1. Update the relevant row status / gap notes in the parity or differentiators tables.
2. Move backlog items between P0/P1/P2 or mark Done.
3. Prefer package paths over vague “somewhere in canvas”.
4. Do not treat Polotno parity as the ceiling — call out differentiators explicitly.
