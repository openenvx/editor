# Cloud handoff — protocol + elements + widget-sdk

After publishing from editor-core, update openenvx-cloud:

## Packages to publish (editor-core)

1. `@openenvx/schema` (SCHEMA_VERSION 4 — widget `handlers`)
2. `@openenvx/protocol` (`RenderNode`, `ExtensionManifest`, unified messages, sandbox grants)
3. `@openenvx/elements` (Preact `/canvas` `/html` `/panel` vocabulary only)
4. `@openenvx/widget-sdk` (`defineExtension`, `define*Component`, `renderToElementTree`, `renderPanelTree`, Vite packaging)
5. `@openenvx/studio` (depends on the above)

Do **not** publish until the human asks.

## openenvx-cloud changes (after publish)

```ts
// Panel vocabulary
export { Pane, Row, Block /* … */ } from '@openenvx/elements/panel';
// Expand helper
export { renderPanelTree } from '@openenvx/widget-sdk';
```

Swap dependency `@openenvx/protocol` → `@openenvx/protocol` if still present.

Keep importing message/grant types from `@openenvx/protocol`.

`packages/studio-host` only needs the protocol message types — bump the pin, no authoring swap.
