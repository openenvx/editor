# Cloud handoff — protocol + elements + widget-sdk

After publishing from editor-core, update openenvx-cloud:

## Packages to publish (editor-core)

1. `@xmazu/openenvxee-schema` (SCHEMA_VERSION 4 — widget `handlers`)
2. `@xmazu/openenvxee-extensions/protocol` (`RenderNode`, `ExtensionManifest`, unified messages, sandbox grants)
3. `@xmazu/openenvxee-extensions` (Preact `/canvas` `/html` `/panel` vocabulary only)
4. `@xmazu/openenvxee-extensions` (`defineExtension`, `define*Component`, `renderToElementTree`, `renderPanelTree`, Vite packaging)
5. `@xmazu/openenvxee-studio` (depends on the above)

Do **not** publish until the human asks.

## openenvx-cloud changes (after publish)

```ts
// Panel vocabulary
export { Pane, Row, Block /* … */ } from '@xmazu/openenvxee-extensions/panel';
// Expand helper
export { renderPanelTree } from '@xmazu/openenvxee-extensions';
```

Swap dependency `@xmazu/openenvxee-extensions/protocol` → `@xmazu/openenvxee-extensions/protocol` if still present.

Keep importing message/grant types from `@xmazu/openenvxee-extensions/protocol`.

`packages/studio-host` only needs the protocol message types — bump the pin, no authoring swap.
