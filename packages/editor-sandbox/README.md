# `@openenvx/editor-sandbox`

Sandbox extension SDK: wire protocol (`./protocol`), Preact element tags (`./canvas`, `./html`, `./panel`), `defineExtension`, Vite isolate packaging (`./vite`), and optional host runtime (`./host`).

```tsx
/** @jsxImportSource @openenvx/editor-sandbox */
import { Stack, Text } from '@openenvx/editor-sandbox/canvas';
import { defineCanvasComponent, string } from '@openenvx/editor-sandbox';

export const demo = defineCanvasComponent({
  id: 'wm.demo',
  label: 'Demo',
  props: { title: string({ label: 'Title', default: 'Hi' }) },
  render({ props, setProps }) {
    return (
      <Stack onClick={() => setProps({ title: 'Clicked' })}>
        <Text value={props.title} />
      </Stack>
    );
  },
});
```

| Subpath | Use |
| --- | --- |
| `.` | Authoring API |
| `./protocol` | Wire types and validators (no Preact) |
| `./host` | QuickJS runtime, `SandboxExtensionHost`, `mountSandboxExtensions` |
| `./canvas` / `./html` / `./panel` | Element vocabulary |
| `./vite` | `bundleWidgetSources()` for isolates |

Hosts wire sandbox via `WorkbenchShell` `mountExternalHosts` and `mountSandboxExtensions` from `./host`. Artboard `./studio` packages export helpers such as `createHtmlSandboxExtensionHost` and `createCanvasSandboxExtensionHost`.

## License

MPL-2.0 - see [LICENSE](../../LICENSE) in the repository root.
