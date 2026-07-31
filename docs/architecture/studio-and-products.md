# Studio & products

**Audience:** Internal engineers and coding agents. Packages: `@xmazu/openenvxee-studio`, `@xmazu/openenvxee-html-studio`, and the apps that consume them.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md).

## Why fat bundles exist

Host product apps (dashboard Studio, embed host, demos) should not wire every private workspace package by hand. Studio packages:

1. Re-export the public authoring surface (`core`, `headless`, domain engine, chrome)
2. Inline private deps into published `dist/` where applicable
3. Ship a default plugin list + sandbox factory helpers

Publishing intent: [PUBLISHING.md](../../PUBLISHING.md). Only `studio`, `schema`, and `plugin-protocol` publish today; `html-studio` stays workspace-private.

## `@xmazu/openenvxee-studio` (canvas product)

Re-exports: `core`, `headless`, `canvas`, `canvas-pro`, `agent`, `driver-image`, plus workbench host surface (`WorkbenchShell`, embed/sandbox mounts, themes, default chrome plugins).

```ts
export const DEFAULT_STUDIO_PLUGINS = [
  new CanvasBasicsPlugin(),
  new DriverImagePlugin(),
  new CanvasProPlugin(),
  new CanvasTemplatePlugin(),
  new AgentChatPlugin(),
];
```

Pages/Layers + dirty status come from `WorkbenchShell` defaults — not from this list.

`createSandboxExtensionHost(options)` wires canvas widget click binding + `WIDGET_LAYER_TYPE` so **workbench never imports canvas**; studio is the seam.

Host apps typically:

1. Construct `WorkbenchController` / use shell props with `DEFAULT_STUDIO_PLUGINS`
2. Mount `WorkbenchShell` with optional `mountExternalHosts` for embed/sandbox
3. Alias studio to `src/` in monorepo Vite/tsconfig for HMR (`apps/canvas-demo`)

## `@xmazu/openenvxee-html-studio` (HTML product)

Re-exports: `core`, `headless`, `html`, workbench shell surface (no sandbox/embed helpers in the thin index today).

```ts
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
```

## What hosts must not do

Per AGENTS.md product-host rules:

- Do **not** mount React panel views from the product host for form/settings — declare `ViewContribution` with `buildProperties` / `emptyMessage` / `when`
- Do **not** import shell-internal `ViewPane` / `PropertyContentRenderer`
- Use `registerViewPanel` only for non-form surfaces
- Embed **policy/data API** stays in editor-core; embed **product panels** (e.g. Embed Options) live in the product host repo, not canvas-pro Inspector contributions

## Demo apps (monorepo)

| App                    | Role                                  |
| ---------------------- | ------------------------------------- |
| `apps/canvas-demo`     | Studio + canvas + external host demos |
| `apps/demo-playground` | Composable / custom shell patterns    |
| `apps/html-demo`       | HTML block studio                     |
| `apps/docs`            | Extension guide and contracts         |

## Related

- [canvas.md](canvas.md) · [html.md](html.md) · [extensions.md](extensions.md)
