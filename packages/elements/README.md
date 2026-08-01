# `@openenvx/elements`

Preact **element vocabulary** only — canvas, HTML, and panel intrinsics that emit string-tag VNodes. Authoring (`define*`, props schema, expand, Vite packaging) lives in [`@openenvx/widget-sdk`](../widget-sdk).

```tsx
import { Stack, Text } from '@openenvx/elements/canvas';

export function Face() {
  return (
    <Stack direction="vertical" padding={16}>
      <Text fontSize={24} value="Hello" />
    </Stack>
  );
}
```

| Subpath   | Vocabulary                                |
| --------- | ----------------------------------------- |
| `/canvas` | `Stack`, `Row`, `Grid`, `Rect`, `Text`, … |
| `/html`   | `Section`, `Row`, `Column`, `Heading`, …  |
| `/panel`  | `Pane`, `Menu`, `Toolbar`, …              |

See [widget-bridge.md](../../docs/architecture/widget-bridge.md) for how trees become scene layers via the QuickJS host.
