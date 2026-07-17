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
| **Pro** | Lives in `@openenvx/canvas-pro`, `@openenvx/studio`, or other closed packages |

## Polotno parity matrix

Baseline competitor: [Polotno SDK](https://polotno.com/) drag-and-drop canvas (zoom/pan, layers, grid, multi-page, bleed/trim, rulers, undo, schema automation).

| Feature | Status | Tier | Where | Gap notes |
| --- | --- | --- | --- | --- |
| Drag-and-drop editing (move / resize) | **Done** | OSS | `packages/canvas/src/canvas-stage-layer.tsx`, `packages/canvas/src/canvas-stage.tsx`, `packages/canvas/src/interactions/layer-transform-strategy.ts`, `packages/canvas/src/commands/canvas-api-commands.ts` | Pixel-level move/resize via Konva + Transformer. |
| Zoom and pan | **Done** | OSS | `packages/canvas/src/viewport.ts`, `packages/canvas/src/commands/canvas-zoom-commands.ts`, `packages/core/src/workbench/editor-viewport-service.ts` | Wheel pan, ctrl/pinch zoom, zoom-to-fit commands. Dedicated pan-tool UX is secondary. |
| Layers panel (organize / reorder / lock / hide) | **Done** | Pro UI + OSS model | `packages/schema` (`visible`, optional `name`), `packages/core/src/plugins/scene-plugin.ts` (`scene.toggleLayerLock`, `scene.toggleLayerVisibility`, `scene.renameLayer`), `packages/canvas-pro` layers panel, canvas stage + export skip hidden | Reorder, lock, hide/show, and inline rename (custom `name` or type label). Hidden layers are non-interactive and omitted from export. |
| Snap to grid / guides / alignment | **Done** | Pro | `packages/canvas-pro/src/snap/smart-guides/`, `packages/canvas/src/snap/grid-snap.ts`, `packages/canvas/src/rulers/`, `packages/canvas-pro/src/stage/smart-guides-stage-interaction.ts`, `packages/canvas-pro/src/commands/align-layers-commands.ts` | Smart guides + align/distribute + snap-to-grid (8px) + user-placed guides (drag from rulers). Guides are session-only (not in schema / undo). |
| Grid controls | **Partial** | OSS + Pro | `packages/canvas` (`CanvasGridSettings`, overlay), studio/canvas-pro toolbar | Overlay + snap toggle (`canvas.toggleGrid`); fixed 8px size. **No grid size picker.** |
| Multi-page / artboards | **Done** | OSS model + Pro UI | `packages/schema` (`Scene.pages`), `packages/core` (`setActivePage`, `scene.addPage` / `removePage` / `duplicatePage` / `renamePage`), `packages/canvas-pro` Pages sidebar | Multi-page document, switch page, add / delete / duplicate / drag-reorder / inline rename. |
| Bleed and trim | **Done** | OSS | `packages/schema` (`bleedMm` / `safeMm`, `page-print.ts`), `packages/canvas/src/page-margins.ts`, `packages/driver-image/src/crop-marks.ts`, `apps/export-service` | Page size = trim; defaults bleed 3 mm / safe 10 mm on print-eligible pages. Canvas print-guide overlay (safe + bleed edge). SVG/PDF crop marks when bleed > 0; PNG/JPG stay trim-only. |
| Rulers and measurements | **Done** | OSS + Pro | `packages/canvas/src/rulers/`, canvas-pro toolbar (`canvas.toggleRulers`), selection size label + inspector | Top/left rulers with ticks + cursor markers; drag-out guides. |
| Undo / redo history | **Done** | OSS | `packages/core/src/scene/history-stack.ts`, `packages/core/src/scene/scene-store.ts`, `packages/core/src/plugins/scene-plugin.ts` (`scene.undo` / `scene.redo`) | Snapshot history (depth 100). |
| Automation and schema control | **Done** | OSS | `packages/schema`, `packages/agent`, `apps/agent-service` | Zod + published JSON Schema; agent proposals mutate scene. Stronger automation story than Polotno alone. |
| Layer types: text / image / shape / video / SVG | **Partial** | OSS | `packages/schema/src/types.ts` (`canvas.rect\|image\|text\|circle\|group`), `packages/canvas/src/layers/` | Text (rich), image, rect, circle, group: yes. SVG as image paste/export, not `canvas.svg`. **Video: missing.** |
| Grouping | **Done** | OSS | `packages/canvas/src/commands/canvas-group-commands.ts`, `packages/canvas/src/scene/group-layers.ts` | Nested groups; layers tree shows children. |
| Rotation / transforms | **Done** | OSS | Schema `rotation` (+ optional `scaleX`/`scaleY`), Konva rotater, `canvas.rotateLeft` / `rotateRight` | Free rotation + box resize. Independent scale tool is not first-class. |
| Lock layers | **Done** | OSS | Schema `locked` / `writeMode`, `scene.toggleLayerLock` | Runtime lock + template writeMode. |
| Export | **Partial** | OSS + service | `packages/canvas/src/export/`, `packages/driver-image`, `apps/export-service` | Client SVG/PNG/JPG; PDF via export-service; page presets mm/dpi. Hidden layers skipped. SVG/PDF include bleed + crop marks when `bleedMm` > 0. **No CMYK/spot-color print pipeline.** |

## Better than Polotno — differentiators

OpenEnvx should not stop at parity. These are existing or planned edges.

### Already ahead (expand)

| Differentiator | Status | Where | Notes |
| --- | --- | --- | --- |
| AI agent automation / scene proposals | **Done** (expand) | `packages/agent`, `apps/agent-service` | Programmatic layout generation and proposal apply — core product wedge. |
| Plugin / contribution architecture | **Done** (expand) | `packages/core`, `packages/headless`, `packages/canvas` | Extensible layer types, commands, sidebars, inspectors — not a closed monolith. |
| Headless controller + schema-first | **Done** (expand) | `packages/headless`, `packages/schema`, `packages/core` scene store | Server-safe scene mutation, reproducible JSON, automation without the React shell. |
| Template policy / frozen layers | **Partial** | Schema `writeMode` / lock + template constraints | Constrained editing for marketing templates; deepen policy surface. |
| Composable apps (OSS canvas + custom shell) | **Done** | `apps/demo-playground`, Architecture.md | Hosts own UX; Polotno is more “embed our UI”. |

### Planned advantages (should still offer)

| Differentiator | Status | Target packages | Notes |
| --- | --- | --- | --- |
| Full page CRUD UX | **Done** | `packages/core`, `packages/canvas-pro` | Add / delete / duplicate / rename / reorder pages as first-class commands + Pages sidebar / palette / context menu. |
| Layer visibility | **Done** | `packages/schema`, `packages/core`, canvas-pro layers UI, canvas stage, driver-image export | Schema `visible` + `scene.toggleLayerVisibility` + layers panel eye toggle; hidden layers skipped in render/export. |
| Grid overlay + snap-to-grid | **Done** | `packages/canvas` (+ pro chrome) | Fixed 8px grid; overlay + snap toggle (`canvas.toggleGrid`); smart guides win over grid when both hit. |
| User guides + rulers | **Partial** | `packages/canvas`, `packages/canvas-pro` | Top/left rulers; drag-out guides; snap against guides; `canvas.toggleRulers` / `canvas.clearGuides`. **Session-only** (not schema/history; lost on reload). |
| True bleed / trim / crop marks | **Done** | `packages/schema`, `packages/canvas`, `packages/driver-image`, `apps/export-service` | Schema `bleedMm`/`safeMm`; canvas overlays; SVG/PDF crop marks. No inspector UI yet (defaults + schema). |
| Video layer + timeline | **Planned** | `packages/schema`, `packages/canvas` | First-class `canvas.video` (and later animation timeline). |
| Dedicated SVG layer | **Planned** | `packages/schema`, `packages/canvas` | Native SVG object, not only rasterized/image paste. |
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
- **Video layer** — `canvas.video` in schema + Konva/HTML media renderer in `packages/canvas`.
- **Dedicated SVG layer** — `canvas.svg` type with editable/preserve-vector path where practical.
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
