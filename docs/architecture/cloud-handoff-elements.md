# Cloud handoff — protocol + elements

After publishing from editor-core, update openenvx-cloud:

## Packages to publish (editor-core)

1. `@xmazu/openenvxee-schema` (SCHEMA_VERSION 4 — widget `handlers`)
2. `@xmazu/openenvxee-protocol` (replaces `@xmazu/openenvxee-plugin-protocol` — RenderNode, ExtensionManifest, unified messages, sandbox grants)
3. `@xmazu/openenvxee-elements` (authoring SDK + `/canvas` `/html` `/panel` + `defineExtension`)
4. `@xmazu/openenvxee-studio` (depends on the above)

Do **not** publish until the human asks.

## openenvx-cloud changes (after publish)

`packages/embed/src/index.ts` currently re-exports `h`, token elements, `beginRender` from the old plugin-protocol package. After the slim protocol lands:

```ts
// Replace hyperscript re-exports with:
export {
  Pane, Row, Block, /* … */, renderPanelTree,
} from '@xmazu/openenvxee-elements/panel';
```

Swap dependency `@xmazu/openenvxee-plugin-protocol` → `@xmazu/openenvxee-protocol`.

Keep importing message/grant types from `@xmazu/openenvxee-protocol` (renamed package; message types are now `render` / `invoke` / `context` / `command`).

`packages/studio-host` only needs the protocol message types — bump the pin, no authoring swap.

Roadmap: eventual full deletion of a separate protocol package is tracked under M4 in `openenvx-cloud/docs/roadmap.md`.
