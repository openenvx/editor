# OpenEnvx product roadmap (packages & APIs)

Companion to [Architecture.md](../../Architecture.md). This tracks intentional follow-ups after the `@openenvx/editor-sandbox` merge.

## Phase 1 - Done

- Merge protocol, elements, and widget-sdk → **`@openenvx/editor-sandbox`** (done)
- Sunset embed / `plugin-panel` host lane from product surface
- Consolidate author docs under `docs/architecture/`

## Phase 2 - Done

- Merged `@openenvx/headless`, `@openenvx/core/schema`, and `@openenvx/core/preview` into private **`@openenvx/core`** (`./schema`, `./preview`, `.`, `./react`)
- Deleted separate workspace packages; monorepo imports updated

## Phase 3 - Enterprise editor + React host plugin API

- Export from `@openenvx/canvas-studio`: **`defineHostPlugin`** (name TBD) - React composition for full **workbench chrome** parity (views, toolbar, menu, status, commands, `registerViewPanel`) without exposing `Plugin` / DI
- Adapter wraps existing contribution classes internally
- Phase 3b: extend façade toward layer types / field renderers (today’s internal-only surface)

## Phase 4 - Done

- `@openenvx/html-studio` published on public npm (minified bundle + drop-in `HtmlEditor` + host composition API)
- Legacy `@openenvx/html-studio` removed from this repo

## Publish note

When cutting a release: publish `@openenvx/editor-sandbox`, `@openenvx/html-studio`, `@openenvx/email-studio`, and `@openenvx/canvas-studio`. Bump product repos in the same window.
