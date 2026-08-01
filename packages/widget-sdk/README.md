# `@xmazu/openenvxee-widget-sdk`

Widget **authoring** SDK: `defineCanvasComponent` / `defineHtmlComponent` / `defineExtension`, props schema, `renderToElementTree`, Vite isolate packaging.

Preact element tags live in `@xmazu/openenvxee-elements`. Host bridge + `openenvx.*` injection live in workbench QuickJS sandbox.

```tsx
/** @jsxImportSource preact */
import { Stack, Text } from '@xmazu/openenvxee-elements/canvas';
import { defineCanvasComponent, string } from '@xmazu/openenvxee-widget-sdk';

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

**Ownership**

| Concern | Where |
| --- | --- |
| Persistent widget state | Document `data.values` on the host scene layer |
| Face expand (Preact → `RenderNode`) | QuickJS isolate (`renderWidgetFace`) |
| Map tree → layers / paint | Host (`applyWidgetFace` → Konva / HTML) |
| `openenvx.*` bridge | Workbench injects into isolate only |

Packaging: `@xmazu/openenvxee-widget-sdk/vite` → `bundleWidgetSources()`.
