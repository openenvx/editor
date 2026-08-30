# @openenvx/html-studio

Drop-in React HTML block editor for OpenEnvx, plus a curated product-host surface for apps that compose custom plugins (e.g. Snapvelo). Bundled workbench UI, minified ESM, public npm.

## Install

```bash
npm install @openenvx/html-studio react react-dom
```

## Drop-in editor

```tsx
import { HtmlEditor } from '@openenvx/html-studio';
import {
  createHtmlScene,
  renderBlockDocument,
} from '@openenvx/html-studio/runtime';
import '@openenvx/html-studio/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <HtmlEditor
        theme="dark"
        onChange={(scene) => {
          void renderBlockDocument(scene).then((html) =>
            console.log(html.length)
          );
        }}
      />
    </div>
  );
}
```

Import `@openenvx/html-studio/theme.css` if your bundler does not apply CSS imported from JS. For Node/SSR block rendering, import `@openenvx/html-studio/runtime` - it does not load the editor shell.

## Product hosts (compose plugins)

For full control (custom blocks, sidebars, asset services), mount `WorkbenchShell` with your plugins:

```tsx
import {
  DEFAULT_HTML_STUDIO_PLUGINS,
  DEFAULT_HTML_LAYOUT,
  WorkbenchShell,
  type WorkbenchPlugin,
} from '@openenvx/html-studio';
import { renderBlockDocument } from '@openenvx/html-studio/runtime';
import '@openenvx/html-studio/theme.css';

const PLUGINS = [...DEFAULT_HTML_STUDIO_PLUGINS, new MyProductPlugin()];

<WorkbenchShell
  initialScene={scene}
  layout={DEFAULT_HTML_LAYOUT}
  plugins={PLUGINS}
/>;
```

Guest/SSR pages should use `./runtime` only (`renderBlockDocument`, `BlockRegistry`, `builtinBlocks`) so TipTap and shell chrome stay out of the public bundle.

## Public API

| Export | Description |
| --- | --- |
| `HtmlEditor` | Full HTML block editor (blocks sidebar, inspector, preview) |
| `WorkbenchShell` | Compose custom plugins and layout |
| `DEFAULT_HTML_STUDIO_PLUGINS` | Default `HtmlBlocksPlugin` list |
| `createHtmlSandboxExtensionHost` | Sandbox widgets wired for HTML faces |

Headless helpers on `@openenvx/html-studio/runtime`:

| Export | Description |
| --- | --- |
| `createHtmlScene()` | Starter block page (default `HtmlEditor` scene) |
| `renderBlockDocument(scene)` | Static HTML from block tree |
| `BlockRegistry`, `builtinBlocks` | Block registry for custom hosts |

The main entry also re-exports core scene types, HTML block APIs, and workbench contribution helpers for product hosts.

## License

MPL-2.0 - see [LICENSE](../../../LICENSE) in the repository root.
