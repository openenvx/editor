# HTML block editor

**Audience:** Internal engineers and coding agents. Package: `@openenvx/html` (+ product re-exports in `@openenvx/html-studio`).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Role

Puck-style block editor for pages with `page.layout === 'html'`. Same core/headless/workbench stack as canvas; **no** `@openenvx/canvas` dependency.

## What html owns

- Block config registry, block renderers, nested drop zones (dnd-kit)
- Composite blocks via named **`slots`** on `BlockConfig` — real part layers under `data.slots` (not `data.children`), so they stay invisible to the Layers tree and `walkLayers`
- Nesting via `data.children`; composites via `data.slots`
- `HtmlEditorPane` registered for `page.layout === 'html'` (preview surface; props via shared inspector; slot parts editable inline + via generated inspector fields)
- Device/zoom chrome via `HtmlToolbarContribution` → workbench `EditorChrome` (`top-center`); state in `HtmlPreviewChromeService` + `html.*` preview commands — no React toolbar in this package. Hosts should use `DEFAULT_HTML_LAYOUT` (`editorToolbars: true`) or set the flag themselves.
- Hosts trim chrome via context keys `html.hideFluidPreset` and `html.hideZoomControls`, or pass options to `registerHtmlPreviewChrome(ctx, { initialPreset?, hideFluidPreset?, hideZoomControls? })` (e.g. product studios that only need mobile + desktop at fit-width). Options from every plugin activation are **merged** before the first registration; context keys apply on every call even when preview commands are already registered.
- Commands: `html.insertBlock`, `html.moveBlock`, `html.updateBlockData`, `html.removeBlock`, plus `html.setDevicePreset` / `html.zoom*`
- `HtmlBlocksPlugin` — `LayerDefinition`s, commands, editor pane, primary activity-sidebar **Blocks** panel (`html.blocks`)
- Built-in composites: `html.hero` (slots: headline / body / actions), `html.button`
- Sandbox extension `contributes.blocks` (via `extensionBlockStore`) appear in the same Blocks palette; insert drops an `openenvx.widget` under `html.root` and the isolate maps the face into `data.children`
- HTML sandbox widget faces persist `data.handlers` (click handler ids), support `bind` write-back into nested `data.values` paths, and map face parts with `writeMode: 'content'` / `showInLayers: false` (atomic widget row in Layers; inline TipTap on bound text). Inspector fields come from `data.manifest` via shared `OpenEnvxWidgetLayer` (`@openenvx/core`; also registered by canvas).

## Slots vs children

| Mechanism       | Storage               | Visible in Layers tree         |
| --------------- | --------------------- | ------------------------------ |
| Nesting         | `data.children`       | Yes (normal layer walk)        |
| Composite parts | `data.slots.<name>[]` | No — atomic parent in the tree |

Inspector fields for slot parts use paths like `slots.headline.0.data.html`.

## Block chrome (`chromeDisplay`, `childContainerHost`)

| `chromeDisplay` | Editor behavior |
| --- | --- |
| `block` (default) | Full-width wrapper around the block for selection outline and DnD |
| `inline` | Hug content for horizontal siblings (e.g. icon links) |
| `contents` | No wrapper div — chrome props (`hostProps`) mount on the block's rendered root (e.g. email `email.column` → `<td>`). CSS is `position: relative` on that host, **not** CSS `display: contents` (invalid inside tables). |

`childContainerHost: 'table-row'` (email `email.row`) mounts the child-list drop target on the row's `<tr>` so columns remain valid `<td>` children.

## Product host

`@openenvx/html-studio` re-exports core + headless + html + workbench shell surface and ships:

```ts
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
```

Demo: `apps/html-demo`. See [studio-and-products.md](studio-and-products.md).

## What does **not** belong in html

- Konva / absolute layout engine
- Canvas-pro chrome
- Embed/sandbox host adapters (workbench / studio)

## Related

- Surface naming (stage / artboard / page root) + click selection: [html-editor-surfaces.md](html-editor-surfaces.md)
- Workbench chrome shared with canvas studio: [workbench-and-headless.md](workbench-and-headless.md)
