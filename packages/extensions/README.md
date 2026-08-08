# `@xmazu/openenvxee-extensions`

Sandbox **author** SDK: wire protocol (`./protocol`), Preact element tags (`./canvas`, `./html`, `./panel`), `defineExtension`, `renderToElementTree`, and Vite isolate packaging (`./vite`).

Host rendering (QuickJS, workbench, scene applicators) is **not** in this package — install `@xmazu/openenvxee-studio` or `@xmazu/openenvxee-html-studio` to host the editor.

```tsx
/** @jsxImportSource @xmazu/openenvxee-extensions */
import { Stack, Text } from '@xmazu/openenvxee-extensions/canvas';
import { defineCanvasComponent, string } from '@xmazu/openenvxee-extensions';

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

| Subpath                           | Use                                  |
| --------------------------------- | ------------------------------------ |
| `.`                               | Authoring API                        |
| `./protocol`                      | Hosts validate trees (no Preact)     |
| `./canvas` / `./html` / `./panel` | Element vocabulary                   |
| `./vite`                          | `bundleWidgetSources()` for isolates |
