# HTML block editor

**Audience:** Internal engineers and coding agents. Package: `@openenvx/html` (+ product re-exports in `@xmazu/openenvxee-html-studio`).

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Role

Puck-style block editor for pages with `page.layout === 'html'`. Same core/headless/workbench stack as canvas; **no** canvas / canvas-pro dependency.

## What html owns

- Block config registry, block renderers, nested drop zones (dnd-kit)
- Composite blocks via named **`slots`** on `BlockConfig` — real part layers under `data.slots` (not `data.children`), so they stay invisible to the Layers tree and `walkLayers`
- Nesting via `data.children`; composites via `data.slots`
- `HtmlEditorPane` registered for `page.layout === 'html'` (preview surface; props via shared inspector; slot parts editable inline + via generated inspector fields)
- Commands: `html.insertBlock`, `html.moveBlock`, `html.updateBlockData`, `html.removeBlock`
- `HtmlBlocksPlugin` — `LayerDefinition`s, commands, editor pane, primary activity-sidebar **Blocks** panel (`html.blocks`)
- Built-in composites: `html.hero` (slots: headline / body / actions), `html.button`
- Sandbox extension `contributes.blocks` (via `extensionBlockStore`) appear in the same Blocks palette; insert drops an `openenvx.widget` under `html.root` and the isolate maps the face into `data.children`

## Slots vs children

| Mechanism       | Storage               | Visible in Layers tree         |
| --------------- | --------------------- | ------------------------------ |
| Nesting         | `data.children`       | Yes (normal layer walk)        |
| Composite parts | `data.slots.<name>[]` | No — atomic parent in the tree |

Inspector fields for slot parts use paths like `slots.headline.0.data.html`.

## Product host

`@xmazu/openenvxee-html-studio` re-exports core + headless + html + workbench shell surface and ships:

```ts
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
```

Demo: `apps/html-demo`. See [studio-and-products.md](studio-and-products.md).

## What does **not** belong in html

- Konva / absolute layout engine
- Canvas-pro chrome
- Embed/sandbox host adapters (workbench / studio)

## Related

- Workbench chrome shared with canvas studio: [workbench-and-headless.md](workbench-and-headless.md)
