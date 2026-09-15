# HTML / email editor surfaces

**Audience:** Engineers and agents talking about click targets, selection, and layout chrome in `@openenvx/html-driver` and `@openenvx/email-driver`.

Hub: [html.md](html.md) · [email-driver.md](email-driver.md).

## Naming (use these words)

| Term | Code / DOM | What it is |
| --- | --- | --- |
| **Pane** | `HtmlEditorPane` / `EmailEditorPane`, `.pane` | The editor host for `page.layout === 'html'` or `'email'`. |
| **Stage** | `.stage`, `role="tree"` | Scrollable field around the page. Padding / empty margin **outside** the artboard. |
| **Artboard slot** | `.artboardSlot`, `data-testid="html-artboard"` / `"email-artboard"` | Layout box sized to the zoomed device frame. This is the visible “page card” on the stage. |
| **Artboard** | `.artboard` | Design-frame element: unscaled CSS width + `transform: scale(zoom)`. Holds the page tree. |
| **Page root** | Top-level `*.root` layer (`html.root`, `email.root`, `snapvelo.root`, …) | Scene layer for page-level props (background, theme tokens, max width). Rendered **without** `BlockChrome` (no outline / selection pill). |
| **Block** | Nested layer under the root | Selectable via `BlockChrome` (`[data-layer-id]`). |

Do **not** call the artboard “canvas” (that word is reserved for Konva / `@openenvx/canvas-driver`). Prefer **stage** for empty chrome around the page, **artboard** for the page card itself.

## Selection rules

| Click target | Result |
| --- | --- |
| Nested block | Select that block (`stopPropagation`). |
| Artboard (page chrome / empty root paint, not a nested block) | Select the **page root**. |
| Stage padding outside the artboard | Clear selection. |
| Escape (stage focused) | Clear selection. |

Page-root props still show in the Inspector when the root is selected (via artboard click or the Layers tree). The root simply has no floating selection menu on the artboard.

## Inline text keyboard

TipTap mounts in at most one block at a time (`editingTarget` in `useBlockTextFlow`). Keys at the caret boundary raise a `RichTextBoundary` intent; the pane resolves it into existing `*.insertBlock` / `*.removeBlock` commands. Slot paths (`slots.*.data.html`) do not participate.

| Key | When | Result |
| --- | --- | --- |
| Enter | Caret at end of a top-level paragraph | Insert a sibling text block after this one and move the caret into it. |
| Shift+Enter | Anywhere | Hard break in place (StarterKit default). |
| Backspace | Document is empty | Remove the block (skipped when it is the only child of its parent) and put the caret at the end of the previous text block. |
| ArrowUp | Caret at document start | Caret to the end of the previous editable text block. |
| ArrowDown | Caret at document end | Caret to the start of the next editable text block. |
| Escape | While editing | Commit HTML and exit inline edit. |

`{{` variable suggest still wins Enter / ArrowUp / ArrowDown when its menu is open. Enter inside a list, blockquote, or code block stays in-document.

## Why the root has no BlockChrome

Nested blocks need a chrome box for outline, hover, drag, and the selection pill. The page root _is_ the frame - wrapping it in chrome would fight layout (full-bleed backgrounds, email columns, product roots). Selection for page props is therefore artboard-driven, not chrome-driven.
