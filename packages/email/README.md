# @openenvx/email

Drop-in React email editor for OpenEnvx. Bundled workbench UI, minified ESM, narrow public API.

## Install

```bash
npm install @openenvx/email react react-dom
```

## Usage

```tsx
import { EmailEditor, type Scene } from '@openenvx/email';
import { createEmailScene, renderEmailHtml } from '@openenvx/email/runtime';
import '@openenvx/email/theme.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <EmailEditor
        theme="dark"
        onChange={(scene) => {
          void renderEmailHtml(scene).then((html) => console.log(html.length));
        }}
      />
    </div>
  );
}
```

Import `@openenvx/email/theme.css` if your bundler does not apply CSS imported from JS (the React entry already pulls in the same file). For Node/SSR HTML export, import `@openenvx/email/runtime` — it does not load the editor shell.

The published tarball is minified ESM + one CSS file. Types are a narrow public surface (`EmailEditor`, `Scene` as opaque JSON, HTML export helpers) — not the internal editor schema.

## Public API

| Export | Description |
| --- | --- |
| `EmailEditor` | Full email editor (layers, inspector, blocks, templates, preview). **Formatted paste:** Cmd/Ctrl+V in the artboard (outside inline text edit) converts clipboard HTML/plain into email blocks (headings, text, lists, links, images, dividers) inserted after the selection. |
| `Scene` | Opaque JSON document for persistence (`onChange` / `initialScene`) |

Headless helpers live on `@openenvx/email/runtime`:

| Export | Description |
| --- | --- |
| `createEmailScene()` | Starter welcome-email scene (also the default `initialScene`) |
| `renderEmailHtml(scene)` | Export email-safe HTML via React-Email |

## License

MIT
