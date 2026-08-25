# @openenvx/email

Drop-in React email editor for OpenEnvx. Bundled workbench UI, minified ESM, narrow public API.

## Install

```bash
npm install @openenvx/email react react-dom
```

## Usage

```tsx
import { EmailEditor, createEmailScene } from '@openenvx/email';
import { renderEmailHtml } from '@openenvx/email/runtime';
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

Import `@openenvx/email/theme.css` once (tokens + editor chrome). For Node/SSR HTML export, import `@openenvx/email/runtime` — it does not load the editor shell.

## Public API

| Export | Description |
| --- | --- |
| `EmailEditor` | Full email editor (layers, inspector, blocks, templates, preview) |
| `createEmailScene()` | Starter welcome-email scene (also the default `initialScene`) |
| `renderEmailHtml(scene)` | Export email-safe HTML via React-Email |
| `Scene` | Scene JSON type for persistence |

## License

MIT
