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
| **OSS** | Available in `@openenvx/core`, `@xmazu/openenvxee-schema`, `@openenvx/canvas`, drivers |
| **Pro** | Lives in `@openenvx/canvas`, `@xmazu/openenvxee-studio`, or other closed packages |

## Polotno parity matrix

Baseline competitor: [Polotno SDK](https://polotno.com/) drag-and-drop canvas (zoom/pan, layers, grid, multi-page, bleed/trim, rulers, undo, schema automation).

| Feature | Status | Tier | Where | Gap notes |
| --- | --- | --- | --- | --- |
| Drag-and-drop editing (move / resize) | **Done** | OSS | `packages/canvas/src/canvas-stage-layer.tsx`, `packages/canvas/src/canvas-stage.tsx`, `packages/canvas/src/interactions/layer-transform-strategy.ts`, `packages/canvas/src/commands/canvas-api-commands.ts` | Pixel-level move/resize via Konva + Transformer. |
| Zoom and pan | **Done** | OSS | `packages/canvas/src/viewport.ts`, `packages/canvas/src/commands/canvas-zoom-commands.ts`, `packages/core/src/workbench/editor-viewport-service.ts` | Wheel pan, ctrl/pinch zoom, zoom-to-fit commands. Dedicated pan-tool UX is secondary. |
| Layers panel (organize / reorder / lock / hide) | **Done** | Pro UI + OSS model | `packages/schema` (`visible`, optional `name`), `packages/core/src/plugins/scene-plugin.ts` (`scene.toggleLayerLock`, `scene.toggleLayerVisibility`, `scene.renameLayer`), `packages/canvas` layers panel, canvas stage + export skip hidden | Reorder (including nest-into empty containers with `data.children`), lock, hide/show, and inline rename (custom `name` or type label). Hidden layers are non-interactive and omitted from export. |
| Snap to grid / guides / alignment | **Done** | Pro | `packages/canvas/src/snap/smart-guides/`, `packages/canvas/src/snap/grid-snap.ts`, `packages/canvas/src/rulers/`, `packages/canvas/src/stage/smart-guides-stage-interaction.ts`, `packages/canvas/src/commands/align-layers-commands.ts` | Smart guides + align/distribute + snap-to-grid + user-placed guides (drag from rulers). Guides persist on `Page.guides` and participate in undo. |
| Grid controls | **Done** | OSS + Pro | `packages/canvas` (`CanvasGridSettings`, overlay), studio/canvas toolbar | Overlay + snap toggle (`canvas.toggleGrid`); size picker (`canvas.setGridSize`, presets 4 / 8 / 16 / 32). |
| Multi-page / artboards | **Done** | OSS model + Pro UI | `packages/schema` (`Scene.pages`), `packages/core` (`setActivePage`, `scene.addPage` / `removePage` / `duplicatePage` / `renamePage`), `packages/workbench` Pages sidebar (`workbench.pages`) | Multi-page document, switch page, add / delete / duplicate / drag-reorder / inline rename. |
| Bleed and trim | **Done** | OSS + Pro UI | `packages/schema` (`bleedMm` / `safeMm`, `page-print.ts`), `packages/canvas/src/page-margins.ts`, openenvx-cloud `render-ir` + `export-service`, canvas page inspector | Page size = trim; defaults bleed 3 mm / safe 10 mm on print-eligible pages. Canvas print-guide overlay (safe + bleed edge). Inspector fields when nothing selected (`canvas.setBleedMm` / `setSafeMm`). SVG/PDF crop marks when bleed > 0; PNG/JPG stay trim-only. |
| Rulers and measurements | **Done** | OSS + Pro | `packages/canvas/src/rulers/`, canvas toolbar (`canvas.toggleRulers`), selection size label + inspector | Top/left rulers with ticks + cursor markers; drag-out guides. |
| Undo / redo history | **Done** | OSS | `packages/core/src/scene/history-stack.ts`, `packages/core/src/scene/scene-store.ts`, `packages/core/src/plugins/scene-plugin.ts` (`scene.undo` / `scene.redo`) | Snapshot history (depth 100). Session-local only — not document version history. |
| Document version history | **Partial** | Pro UI + host provider | `VersionHistoryProvider` (`@openenvx/core`), `VersionHistoryPlugin` + panel (`@openenvx/workbench`), `versionHistory.restore` | Figma-style list UI + restore. Host implements `listVersions` / `loadVersion`. Create / rename / delete not in the provider contract yet. |
| Sandbox extensions (plugin + widget) | **Partial** | Pro + `@xmazu/openenvxee-extensions` | `createSandboxExtensionHost` (`@xmazu/openenvxee-studio`), `SandboxExtensionHost` + `mountSandboxExtensions`, `@xmazu/openenvxee-extensions`, `openenvx.widget` layer | Widgets author with `defineCanvasComponent` / `defineHtmlComponent` + `ExtensionManifest`; source pushed into QuickJS Worker (one isolate per extension). Document state = host `data.values`. Demos: canvas-demo seating / save-the-date; html-demo countdown / RSVP / wedding menu. See [widget-bridge.md](docs/architecture/widget-bridge.md). |
| Automation and schema control | **Done** | OSS | `packages/schema`, `packages/agent`, `apps/agent-service` | Zod + published JSON Schema; agent proposals mutate scene. Stronger automation story than Polotno alone. |
| Layer types: text / image / shape / video / SVG | **Partial** | OSS | `packages/schema/src/types.ts` (`canvas.rect\|image\|svg\|text\|circle\|group\|instance`), `packages/canvas/src/layers/` | Text (rich), image, svg, rect, circle, group, instance: yes. **Video: missing.** Image fit `cover\|contain\|fill` + focal point; text shrink-to-fit via `autoFit`; text box height remasure via `fitCanvasTextLayerToContent` / `applyModificationsWithTextFit`. |
| Clipboard paste (text / image) | **Done** | OSS | `packages/canvas/src/clipboard/` | Internal copy/paste/duplicate; external text + image paste. Image paste inserts immediately (`uploading` + session `blob:` preview outside scene JSON), then swaps to the host `AssetService.upload` URL. Save waits until uploads finish. |
| Fonts and typography | **Done** | OSS | `packages/canvas/src/fonts/`, `FontService` + `canvas.registerFont`, text layer props | Full Google Fonts catalog (~1900 families) via `FontService` (faces load from `fonts.googleapis.com` CSS2 — hosts need that CSP). ~40 featured faces preloaded on editor mount + shown in the picker until search (`listFeatured`). Other faces lazy-loaded on `ensureLoaded` / scene preload. System fonts + programmatic `register` (optional remote `src` via `FontFace`). Layer font family / size / fill / align / line height / letter spacing. |
| Rich text editing | **Partial** | OSS | TipTap overlay (`canvas-rich-text-editor.tsx`, `html-rich-text-editor.tsx`), `data.html` | On-canvas and HTML/email-block bubble menu: block type (paragraph / lists / quote / code), link, bold / italic / underline / strike / inline code / color, and alignment. Blocks can hide sections via `BlockConfig.richTextToolbar` / `childRichTextToolbar` (`blockType`, `link`, `code`, `align` — e.g. Snapvelo hero). Shrink-to-fit (`autoFit: 'shrink'`) for fixed-box templated text; otherwise typography/html edits remasure `transform.height` to content. Curved/plain SVG export still strips marks to plain text. |
| HTML block layout editor | **Partial** | OSS | `packages/html/src/editor/html-editor-pane.tsx`, `HtmlToolbarContribution`, `HtmlPreviewChromeService`, `block-dnd.ts`, `html.flex` / `html.grid`, `html.hero` | Visual block tree with drag reorder via the selection-pill **Move** handle (not whole-block grab); Layers panel reorder unchanged. Flex/Grid hold flat children. Composite blocks use named `data.slots` (atomic in Layers tree). Selection toolbar (duplicate/delete + **Replace image** via `AssetService` when present — pill, surface drop, slot click), double-click text edit, Delete/Backspace (via `scene.deleteLayer`; Page root protected). Device/zoom via workbench overlay toolbar contributions (`top-center`). Artboard click selects the page root (`*.root`) for page props (no floating selection pill on the root); stage padding / Escape clears selection. See `docs/architecture/html-editor-surfaces.md`. Targets simple web pages + product templates (e.g. SnapVelo, WeselneMomenty). **Email-client HTML** lives in `@openenvx/driver-email`, not here. |
| Email block editor (React-Email) | **Partial** | OSS | `packages/driver-email/` (`EmailBlocksPlugin`, `EmailEditorPane`, `EmailTopBar`, `renderEmailDocument`) | `page.layout === 'email'`. Live block editing reuses html block machinery; export via `@react-email/render` (table-based, inline styles). Editor shows a centered content column on the page body (`email.root` background + body padding; nested sections often supply a white card) with a **top bar** (Editor / HTML / Preview modes, undo/redo, device presets, save) — Preview swaps the artboard for an iframe of `renderEmailDocument` HTML; HTML shows rendered source (no DnD in either). Selection chrome is outline-only (no wrap padding) so edit spacing stays aligned with export. Document font is Inter via react-email `Font` (`@font-face` + Arial/Helvetica fallback); edit artboard uses the same stack (not workbench Geist). Layout primitives map 1:1 to react-email: `email.row` → `<Row>`, `email.column` → `<Column>` (not a synthetic columns flex). Artboard design width 640px; desktop frame 720px (slim body chrome); mobile 390px; root `maxWidth` default 600 (editable) and body `paddingX`/`paddingY` editable. Delete/Backspace removes the selection (Email root protected); selection chrome + context menu also delete. **Templates** activity opens a left gallery sheet (collections → templates drill-down; click loads a full starter Scene via `api.loadScene` — Barebones / Activation first). **Blocks** activity opens a left gallery sheet (search + group filters; patterns via `defineEmailPattern` in `blocks/patterns/` — `email.header`, `email.articleWithImage` as containers whose Elements appear as nested Layers); **Elements** for primitives (root / section / row / column / heading / text / button / image / image link / divider / spacer). Modern clients first; Outlook-desktop VML hardening deferred. **Out of scope for now:** ESP sending, merge tags. |
| HTML composite / slot blocks | **Done** | OSS | `BlockConfig.slots`, `html.hero`, `html.button`, `slotList` field | Named slots hold real part layers under `data.slots` (not `data.children`). One Layers row; inspector + inline edit of parts; repeatable slots via `slotList`. |
| Curved text | **Partial** | OSS | `data.curve`, `rich-text-arc.ts`, Konva `TextPath` | Curve (−100…100): + = arch (center pinned, sides down), − = bowl (sides pinned, center down); circular path + `getSelfRect` box hug. **SVG/PDF export still uses the old degree chord arc in openenvx-cloud `render-ir`** — canvas and export diverge until that path is ported. |
| Grouping | **Done** | OSS | `packages/canvas/src/commands/canvas-group-commands.ts`, `packages/canvas/src/scene/group-layers.ts`, container / hover-drag in `canvas-stage-layer.tsx`, nested snap off in `use-canvas-drag-snap.ts`, canvas context menu / palette | Nested groups; layers tree shows children. Multi-select → **Create group** / group selected → **Ungroup** from canvas and Layers context menus (+ command palette); right-click keeps multi-select. Drag starts on pointer move without a prior click (deep-select child); selected group/widget still drags as a unit. Nested child drag: no document smart guides; group dashed outline is a tight AABB of children (farthest point on each side) — dragging a child never mutates siblings or the group origin. `openenvx.widget` uses the same container path. |
| Rotation / transforms | **Done** | OSS | Schema `rotation` (+ optional `scaleX`/`scaleY`), Konva rotater, `canvas.rotateLeft` / `rotateRight` | Free rotation + box resize. Independent scale tool is not first-class. |
| Lock layers | **Done** | OSS | Schema `locked` / `writeMode`, `scene.toggleLayerLock` | Runtime lock + template writeMode. |
| Export | **Partial** | OSS + service | `openenvx-cloud` `render-ir` + `export-service` | Server SVG/PNG/JPG/PDF via openenvx-cloud export-service API; page presets mm/dpi. Hidden layers skipped. SVG/PDF include bleed + crop marks when `bleedMm` > 0. **No CMYK/spot-color print pipeline.** |

## Better than Polotno — differentiators

OpenEnvx should not stop at parity. These are existing or planned edges.

### Already ahead (expand)

| Differentiator | Status | Where | Notes |
| --- | --- | --- | --- |
| AI agent automation / scene proposals | **Done** (expand) | `packages/agent`, `apps/agent-service` | Supervisor proposals + Media/ImageGen specialists (Unsplash, Iconify, `canvas.svg`, OpenRouter `gpt-image-2` → R2). |
| Plugin / contribution architecture | **Done** (expand) | `packages/core`, `packages/canvas` | Extensible layer types, commands, sidebars, inspectors — not a closed monolith. Primary/secondary view-container locations + content kinds (`tree` / `properties` / `component`) for relocation-ready panes. Host views: optional `ViewContribution.icon` / `group` (accordion headers + section labels), field `description` / `placeholder` / `maxLength`. Inspector `kind: 'segmented'` for short enums (button group); `kind: 'select'` is dropdown-only. Property rows/blocks/input groups support layout `when` (context keys + `$` property paths) — see [property-fields.md](docs/architecture/property-fields.md). |
| Secondary sidebar + layout chrome | **Done** | Pro UI (`packages/workbench`, `ViewLocationService`, `WorkbenchLayout`) | Right sidebar Radix tabs; hide activity bar / primary / secondary independently; move whole containers via header menu; drag-reorder within each side; optional `WorkbenchLayoutStore` persistence. Per–view-container sidebar headers via `SidebarHeaderContribution` (`containerId` + title / dropdown menu / icon actions). |
| Headless controller + schema-first | **Done** (expand) | `packages/core` (`WorkbenchController` + scene store), `packages/schema` | Server-safe scene mutation, reproducible JSON, automation without the React shell. |
| HTML product host bundle | **Done** | `@openenvx/html-studio` (monorepo) + `@xmazu/openenvxee-html-studio` (published) | Curated `WorkbenchShell` + `DEFAULT_HTML_STUDIO_PLUGINS`; Worker-safe `./runtime` (`renderBlockDocument` + overrides, no TipTap/DnD). Published package ships a per-module ESM `dist/` (Vite-tree-shakeable). Product event-page blocks live in host apps (e.g. Snapvelo), not editor-core. |
| Email product host bundle | **Done** | `@openenvx/email` (published, public npm) | Drop-in `EmailEditor` + `createEmailScene` + `renderEmailHtml`; minified fat bundle inlines private stack. Headless export: `./runtime`. No plugin/command/sandbox exports. Monorepo HMR: `apps/email-demo`. Bundle smoke: `apps/email-package-demo`. |
| Template policy / frozen layers | **Partial** | Schema `writeMode` / `showInLayers` / `allowedDataKeys` / `templatePolicy.frozenLayers`, `@openenvx/core`, Embed property panes | Authoring: Embed tab (secondary sidebar) sets per-layer writeMode + showInLayers and document templatePolicy; `enforceTemplatePolicy={false}` on WorkbenchShell. Consumers (embed): policy enforced — hide from Layers + block select when `showInLayers: false`; freeze via `withFrozenLayerSnapshots`. `scene.apply` / agents not fully gated yet. Brand kits deferred. |
| Dynamic templates / data binding | **Done** | OSS + Pro UI | `packages/schema/src/template.ts` (`extractTemplateManifest`, `applyModifications`, `validateTemplateNames`); canvas `applyModificationsWithTextFit`; canvas Template data panel; contract: [template-api-contract.md](docs/architecture/template-api-contract.md) | Bannerbear-style modifications by unique layer `name` (`text`, `imageUrl`, `color`, `fontFamily`, `fontSize`, `hidden`). Shrink-to-fit text **or** remasure text box height to injected copy; image fit/focal point at render time. |
| Composable apps (OSS canvas + custom shell) | **Done** | `apps/demo-playground`, Architecture.md | Hosts own UX; Polotno is more “embed our UI”. |

### Planned advantages (should still offer)

| Differentiator | Status | Target packages | Notes |
| --- | --- | --- | --- |
| Full page CRUD UX | **Done** | `packages/core`, `packages/workbench` | Add / delete / duplicate / rename / reorder pages as first-class commands + Pages sidebar / palette / context menu. |
| Layer visibility | **Done** | `packages/schema`, `packages/core`, canvas layers UI, canvas stage, export-service | Schema `visible` + `scene.toggleLayerVisibility` + layers panel eye toggle; hidden layers skipped in render/export. |
| Grid overlay + snap-to-grid | **Done** | `packages/canvas` (+ pro chrome) | Grid overlay + snap toggle (`canvas.toggleGrid`); size picker (`canvas.setGridSize`, 4 / 8 / 16 / 32); smart guides win over grid when both hit. |
| User guides + rulers | **Done** | `packages/schema` (`Page.guides`), `packages/canvas`, `packages/canvas` | Top/left rulers; drag-out guides persist on the page and undo via `canvas.addGuide` / `moveGuide` / `removeGuide` / `clearGuides`; `canvas.toggleRulers` is session-only. |
| True bleed / trim / crop marks | **Done** | `packages/schema`, `packages/canvas`, `packages/canvas`, openenvx-cloud `export-service` | Schema `bleedMm`/`safeMm`; canvas overlays; page inspector when nothing selected; SVG/PDF crop marks. |
| Video layer + timeline | **Planned** | `packages/schema`, `packages/canvas` | First-class `canvas.video` (and later animation timeline). |
| Dedicated SVG layer | **Partial** | `packages/schema`, `packages/canvas`, `packages/canvas`, openenvx-cloud `export-service` | `canvas.svg` with markup + optional fill/stroke; Konva via data-URL; vector export; lite node attribute editor (select element → edit fill/stroke/`d`/… → rewrite `data.svg`). No Bezier path tool. |
| QR code layer | **Partial** | `packages/schema`, `packages/preview` (`encodeQrToSvg`), `packages/canvas`, `packages/canvas`; openenvx-cloud `render-ir` (pending publish) | Editor-core Done: `canvas.qr` → SVG via `encodeQrToSvg`; manifest kind `qr`; `modifications.text`→`url` / `color`→`foreground`; toolbar / palette insert. Cloud export coded against schema/preview **0.5.4** — mark Done after those packages publish and cloud installs them. |
| Print pipeline (CMYK / spot) | **Planned** | drivers + export-service | Beyond RGB raster PDF for packaging/print SaaS. |
| Component / instance system | **Partial** | `packages/schema`, `packages/core`, `packages/canvas` | One-way symbols: `scene.components` + `canvas.instance`; expand at render/export with per-instance surface ids; commands `canvas.createComponent` / `insertInstance` / `updateComponent`. Expanded definition children are display-only on canvas (select/transform the instance). Nested instances, detach, override UX, and in-instance editing deferred. |
| Real-time collaboration | **Planned** | future `packages/collab` + Liveblocks adapter; openenvx-cloud auth/comments | Whole-scene multiplayer + presence (provider ports); **own** Figma-style async comments (not Liveblocks Comments). Editor-agnostic; first host = email. Deferred design: [docs/plans/2026-08-03-live-collaboration-design.md](docs/plans/2026-08-03-live-collaboration-design.md). |
| Figma-style document comments | **Planned** | `packages/collab` CommentPort + host/cloud API | Async pins/threads/resolve anchored to node/block + position. Same design doc as collab. |

## Prioritized backlog

Gaps and differentiators grouped by priority. Implement in separate PRs; update this file when status changes.

### P0 — Polotno parity blockers for a credible design editor

- ~~**Layer visibility**~~ **Done** — schema `visible`; `scene.toggleLayerVisibility`; canvas eye toggle; stage + export skip hidden.
- ~~**Page CRUD**~~ **Done** — `scene.addPage` / `removePage` / `duplicatePage`; Pages sidebar select + drag reorder; palette / context menu.
- ~~**Grid overlay + snap-to-grid**~~ **Done** — `CanvasGridSettings` + `canvas.toggleGrid`; OSS overlay (`kind: 'grid'`) + snap math; pro toolbar; composed with smart guides.
- ~~**Rulers**~~ **Done** — DOM top/left rulers + cursor markers; `canvas.toggleRulers`.

### P1 — Production and media parity

- ~~**User-placed guides**~~ **Done** — `Page.guides` in schema; `canvas.addGuide` / `moveGuide` / `removeGuide` / `clearGuides` via `scene.apply`; snap via smart guides; rulers visibility remains session-only (`canvas.toggleRulers`).
- ~~**Bleed / trim / crop marks**~~ **Done** — schema `bleedMm` / `safeMm` (defaults 3 mm / 10 mm on print pages); canvas safe + bleed-edge overlays; page inspector (`canvas.setBleedMm` / `setSafeMm`); SVG/PDF crop marks via openenvx-cloud export-service. PNG/JPG trim-only.
- ~~**Dynamic templates / modifications**~~ **Done** — named layers + `applyModifications` / `extractTemplateManifest`; Template data live preview; [template API contract](apps/docs/template-api-contract.md).
- ~~**Text shrink-to-fit**~~ **Done** — `data.autoFit: 'shrink'` + `minFontSize`; `fitFontSize` in canvas + SVG export estimate.
- ~~**Text box fit-to-content**~~ **Done** — `fitCanvasTextLayerToContent` / `applyModificationsWithTextFit` remasure height after injected copy (and on canvas typography edits); skips shrink; curved text hugs TextPath bounds.
- ~~**Image fit + focal point**~~ **Done** — `data.fit` (`cover` / `contain` / `fill`) + `focalPoint`; canvas + SVG `preserveAspectRatio`.
- **Video layer** — `canvas.video` in schema + Konva/HTML media renderer in `packages/canvas`.
- ~~**Dedicated SVG layer**~~ **Partial** — `canvas.svg` stores markup (icons/agent SVG); canvas + SVG export; lite node attribute editor in canvas inspector. Bezier path tool still planned.
- ~~**QR code layer**~~ **Partial** — editor-core: `canvas.qr` + `encodeQrToSvg`; manifest kind `qr`; modifications `text`→`url` / `color`→`foreground`; toolbar insert. Cloud `render-ir` waits on published schema/preview 0.5.4.
- **Hide remaining export gaps** — document DPI in exports; tighten print presets; optional PNG-with-marks flag.

### P2 — Exceed Polotno

- **Deeper AI agent workflows** — richer scene tools, template-aware proposals, batch multi-page generation (`packages/agent` / `apps/agent-service`).
- **Component / instance system** — **Partial** — one-way `scene.components` + `canvas.instance`; create/insert/update commands; expand at render/export. Nested/detach/override UX deferred.
- **Animation / video timeline** — beyond static frames.
- **Print color pipeline** — CMYK / spot where product needs it.
- **Real-time collaboration** — deferred; design locked in [docs/plans/2026-08-03-live-collaboration-design.md](docs/plans/2026-08-03-live-collaboration-design.md): provider ports + Liveblocks adapter, whole-scene sync, presence; first wire email then all editors.
- **Figma-style comments** — own async pin threads (not Liveblocks Comments); ship with collab v1 when picked up.
- **Template policy surface** — brand kits / constrained property sets beyond writeMode + frozenLayers.

## Maintenance

When changing capabilities:

1. Update the relevant row status / gap notes in the parity or differentiators tables.
2. Move backlog items between P0/P1/P2 or mark Done.
3. Prefer package paths over vague “somewhere in canvas”.
4. Do not treat Polotno parity as the ceiling — call out differentiators explicitly.
