# @openenvx/canvas-studio

Drop-in React canvas editor for OpenEnvx. Bundled workbench UI, minified ESM, narrow public API.

## Install

```bash
npm install @openenvx/canvas-studio react react-dom
```

## Usage

```tsx
import { CanvasEditor } from '@openenvx/canvas-studio';
import { createCanvasScene } from '@openenvx/canvas-studio/runtime';
import '@openenvx/canvas-studio/theme.css';
import '@openenvx/canvas-studio/fonts.css';

export function App() {
  return (
    <div style={{ height: '100vh' }}>
      <CanvasEditor
        theme="dark"
        initialScene={createCanvasScene()}
        onChange={(scene) => console.log(scene)}
      />
    </div>
  );
}
```

Import `@openenvx/canvas-studio/theme.css` and `@openenvx/canvas-studio/fonts.css` if your bundler does not apply CSS imported from JS. For headless scene creation without the shell, import `@openenvx/canvas-studio/runtime`.

Raster/PDF/SVG export is not included - use your host export pipeline or OpenEnvx cloud export-service.

## Public API

| Export | Description |
| --- | --- |
| `CanvasEditor` | Full canvas editor (layers, inspector, artboard toolbars) |
| `Scene` | Opaque JSON document for persistence (`onChange` / `initialScene`) |

Headless helpers live on `@openenvx/canvas-studio/runtime`:

| Export | Description |
| --- | --- |
| `createCanvasScene()` | Starter blank artboard scene (also the default `initialScene`) |

## License

MPL-2.0 - see [LICENSE](../../../LICENSE) in the repository root.
