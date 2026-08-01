# `@xmazu/openenvxee-elements`

Widget element SDK for OpenEnvx. Integrators write React-shaped components; trees render to scene JSON for the visual editor and for backend template generation.

```tsx
import {
  Stack,
  Text,
  defineCanvasComponent,
  string,
  color,
} from '@xmazu/openenvxee-elements';

export default defineCanvasComponent({
  id: 'wm.guest-tables',
  label: 'Plan stolow',
  props: {
    heading: string({ label: 'Naglowek', default: 'Plan stolow' }),
    accent: color({ label: 'Kolor', default: '#b08968' }),
  },
  render({ props }) {
    return (
      <Stack direction="vertical" spacing={24} padding={32}>
        <Text fontSize={44} fill={props.accent} value={props.heading} />
      </Stack>
    );
  },
});
```

- **`renderToElementTree(element)`** — pure synchronous expand to element JSON (tests / Node backends). Hosts map further via `applyWidgetFace` / `applyHtmlWidgetFace`.
- **Mounted path** — Preact fake host (optional `mounted: true`) when hooks are needed; default path is sync expand.
- **Subpaths:** `/canvas`, `/html`, `/panel` (panel chrome uses the same Preact + handler-ID model).
- **`defineExtension`** — static `openenvx.extension.json` contributions (widgets, blocks, commands, views, chrome).
- **Vite plugin** — `@xmazu/openenvxee-elements/vite` `openenvxWidgets()`:
  ```ts
  // vite.config.ts
  plugins: [openenvxWidgets()];

  // app — IIFE string for the isolate (host never runs the widget)
  import source from 'openenvx-widget:./seating.widget.tsx';
  await sandbox.pushWidgetSource('wm.seating', source);
  ```

See [docs/architecture/widget-bridge.md](../../docs/architecture/widget-bridge.md), the authoring hub [apps/docs/README.md](../../apps/docs/README.md), and the step-by-step [sandbox extension guide](../../apps/docs/sandbox-extension-guide.md). Demos: wedding widgets in `apps/canvas-demo` / `apps/html-demo`.
