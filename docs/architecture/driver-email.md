# Email driver (React-Email)

**Audience:** Internal engineers and coding agents. Package: `@openenvx/driver-email`.

Hub: [Architecture.md](../../Architecture.md) · Overview: [overview.md](overview.md) · HTML sibling: [html.md](html.md).

## Role

Block editor for pages with `page.layout === 'email'`. Same core/headless/workbench stack as html; depends on `@openenvx/html` for `BlockConfig` / `BlockRegistry` / DnD tree rendering. Export path is React-Email (`@react-email/components` + `@react-email/render`).

## What driver-email owns

- Email `BlockConfig` set wrapping React-Email primitives (`email.root`, `email.section`, `email.row`, `email.column`, `email.heading`, `email.text`, `email.button`, `email.image`, `email.divider`, `email.spacer`)
- **Templates** authored as JSX with inline `style={{ … }}` via `templates/jsx` (`Email`, `Section`, `Text`, …); `sceneFromEmailJsx()` compiles them into an editable Scene (inspector still sees `paddingX` / `marginBottom` / …). Catalog entries call `createScene()` which runs that compile on load.
- Predefined patterns in `blocks/patterns/` via `defineEmailPattern` (one file = layout container + gallery meta; barrel `patterns/index.ts`). Patterns use **`data.children`** (Elements visible in Layers), like `email.section` — not `data.slots`. Examples: `email.header` (logo + `email.link` children), `email.articleWithImage` (image / text / heading / button). Gallery sheet: search + group chips; not the Elements palette
- Own `emailBlockRegistry` + `EmailBlockRegistryServiceId` (does not mix with the html palette)
- `EmailBlocksPlugin` — layer definitions, `email.*` block commands (including `email.pasteFromClipboard` — formatted clipboard HTML/plain → blocks in Editor mode), **Blocks** activity command (opens sheet) + **Elements** (primitives) sidebar, `EmailEditorPane` for `page.layout === 'email'`. **Bottom insert bar** (`EmailToolbarContribution` → workbench `EditorChrome` `bottom-center`: undo/redo, text/layout dropdowns, image insert; gated `email.modeEdit`) when `layout.editorToolbars: true`. Optional **top bar** (`EmailBlocksPlugin({ topBar: true })` → `EmailTopBarContribution` + `registerTopBar(EmailTopBar)`) hosts Editor / HTML / Preview mode switch, undo/redo, device presets, save, and file actions; device/zoom via shared `registerHtmlPreviewChrome()` (`HtmlPreviewChromeService`). Hosts that want the header use `DEFAULT_EMAIL_LAYOUT` (`topBar: true`, `editorToolbars: false`). `@openenvx/email` `EmailEditor` uses overlay toolbars only (no top bar). Artboard design width 640px — desktop frame 720px with slim body chrome, mobile 390px; `email.root` centers content at editable `maxWidth`, default 600
- **Clipboard paste → blocks** — `EmailEditorPane` listens for `paste` in Editor mode (skips inline TipTap and inspector fields). `clipboardHtmlToEmailLayers()` maps headings, paragraphs, lists, links (inline `<a>` in text), https images, and dividers; `email.pasteFromClipboard` inserts after the selection in one undo step (new `email.section` wrapper when pasting at root). Inline text edit keeps native TipTap paste.
- `renderEmailDocument(page, registry)` — walks the layer tree with the same `BlockConfig.render` functions and produces email-safe HTML via `@react-email/render`
- `renderEmailHtml(scene)` — headless scene export (`./runtime`): fresh registry, requires `page.layout === 'email'`

## Editing vs export

| Surface | Path |
| --- | --- |
| Live editor | `EmailEditorPane` → `BlockTreeRenderer` → block `render()` (React-Email components in the DOM). Selection/hover chrome is outline-only (no box padding) so edit layout stays aligned with export; the selection menu (type label + clone/delete) stays available on selectable blocks. `email.column` uses `chromeDisplay: 'contents'` only because a real wrapper breaks `<tr>`→`<td>`. Artboard uses the document Inter + Arial stack (not workbench Geist). |
| Preview mode | Workbench top-center toolbar → iframe `srcDoc` of `renderEmailDocument()` output (device + zoom still apply) |
| HTML mode | Full-pane read-only CodeMirror 6 source view (`EmailHtmlSourceEditor`) of pretty-printed `renderEmailDocument({ pretty: true })` output — line numbers, syntax highlight, search keymap; no device frame; read-only (export HTML does not round-trip into the block scene) |
| Export / copy HTML | `renderEmailDocument()` → same `render()` for every block including `email.root`, wrapped in `<Html><Body>` + optional `<Preview>` + react-email `<Font>` in `<Head>` → string |

One `BlockConfig.render` path keeps editor and export content from drifting. Export only adds document chrome (`Html` / `Head` / `Body` / `Preview` / `Font`). Preview mode shows that export HTML in-frame. Document font is Inter via `@font-face` at weights 400/600/700 with Arial/Helvetica fallback — canvas `FontService` is not used. Headings set explicit `fontSize` / `fontWeight` (not browser UA `h1` defaults) so host edit and iframe preview match. Modern clients (Gmail, Apple Mail, Outlook web) are the fidelity target; Outlook-desktop VML hardening is a follow-up.

## Product host

Hosts load `new EmailBlocksPlugin()` (alongside workbench defaults). Demo: `apps/email-demo` (`bun run dev:email`) opts into the product top bar (`EmailBlocksPlugin({ topBar: true })` + `DEFAULT_EMAIL_LAYOUT`). External OSS hosts use **`@openenvx/email`** (`EmailEditor` drop-in; `./runtime` for Node HTML export; public npm) — floating bottom insert bar + top-center preview device/zoom chrome (`editorToolbars: true`, no product top bar).

## What does **not** belong here

- Web page blocks (`html.*`) — stay in `@openenvx/html`
- Konva / absolute layout
- ESP sending, merge tags, cloud export-service wiring (openenvx-cloud)

## Related

- HTML block editor: [html.md](html.md)
- Surface naming (stage / artboard / page root) + click selection: [html-editor-surfaces.md](html-editor-surfaces.md)
- Workbench chrome: [workbench-and-headless.md](workbench-and-headless.md)
