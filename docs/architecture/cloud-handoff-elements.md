# Cloud handoff — protocol + elements + widget-sdk

After publishing from editor-core, update openenvx-cloud:

## Packages to publish (editor-core)

1. `@xmazu/openenvxee-schema` (SCHEMA_VERSION 4 — widget `handlers`)
2. `@xmazu/openenvxee-protocol` (`RenderNode`, `ExtensionManifest`, unified messages, sandbox grants)
3. `@xmazu/openenvxee-elements` (Preact `/canvas` `/html` `/panel` vocabulary only)
4. `@xmazu/openenvxee-widget-sdk` (`defineExtension`, `define*Component`, `renderToElementTree`, `renderPanelTree`, Vite packaging)
5. `@xmazu/openenvxee-studio` (depends on the above)

Do **not** publish until the human asks.

## openenvx-cloud changes (after publish)

```ts
// Panel vocabulary
export { Pane, Row, Block /* … */ } from '@xmazu/openenvxee-elements/panel';
// Expand helper
export { renderPanelTree } from '@xmazu/openenvxee-widget-sdk';
```

Swap dependency `@xmazu/openenvxee-plugin-protocol` → `@xmazu/openenvxee-protocol` if still present.

Keep importing message/grant types from `@xmazu/openenvxee-protocol`.

`packages/studio-host` only needs the protocol message types — bump the pin, no authoring swap.
