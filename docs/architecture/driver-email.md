# Email driver (React-Email)

**Audience:** Internal engineers and coding agents. Package: `@openenvx/driver-email`.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md) · HTML sibling: [html.md](html.md).

## Role

Block editor for pages with `page.layout === 'email'`. Same core/headless/workbench stack as html; depends on `@openenvx/html` for `BlockConfig` / `BlockRegistry` / DnD tree rendering. Export path is React-Email (`@react-email/components` + `@react-email/render`).

## What driver-email owns

- Email `BlockConfig` set wrapping React-Email primitives (`email.root`, `email.section`, `email.columns`, `email.heading`, `email.text`, `email.button`, `email.image`, `email.divider`, `email.spacer`)
- Own `emailBlockRegistry` + `EmailBlockRegistryServiceId` (does not mix with the html palette)
- `EmailBlocksPlugin` — layer definitions, `email.*` block commands, Blocks sidebar, `EmailEditorPane` for `page.layout === 'email'`
- `renderEmailDocument(page, registry)` — walks the layer tree with the same `BlockConfig.render` functions and produces email-safe HTML via `@react-email/render`

## Editing vs export

| Surface | Path |
| --- | --- |
| Live editor | `EmailEditorPane` → `BlockTreeRenderer` → block `render()` (React-Email components in the DOM) |
| Export / copy HTML | `renderEmailDocument()` → same `render()` for every block including `email.root`, wrapped in `<Html><Body>` + optional `<Preview>` → string |

One `BlockConfig.render` path keeps editor and export content from drifting. Export only adds document chrome (`Html` / `Head` / `Body` / `Preview`). Modern clients (Gmail, Apple Mail, Outlook web) are the fidelity target; Outlook-desktop VML hardening is a follow-up.

## Product host

Hosts load `new EmailBlocksPlugin()` (alongside workbench defaults). Demo: `apps/email-demo` (`bun run dev:email`). There is no email-studio fat bundle yet.

## What does **not** belong here

- Web page blocks (`html.*`) — stay in `@openenvx/html`
- Konva / absolute layout
- ESP sending, merge tags, cloud export-service wiring (openenvx-cloud)

## Related

- HTML block editor: [html.md](html.md)
- Workbench chrome: [workbench-and-headless.md](workbench-and-headless.md)
