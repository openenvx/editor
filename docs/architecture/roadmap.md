# OpenEnvx product roadmap (packages & APIs)

Companion to [Architecture.md](../../Architecture.md). This tracks intentional follow-ups after the `@openenvx/editor-sandbox` merge.

## Phase 1 - Done

- Merge protocol, elements, and widget-sdk → **`@openenvx/editor-sandbox`** (done)
- Sunset embed / `plugin-panel` host lane from product surface
- Consolidate author docs under `docs/architecture/`

## Phase 2 - Done

- Merged `@openenvx/headless`, `@openenvx/studio/schema`, and `@openenvx/studio/preview` into private **`@openenvx/studio`** (`./schema`, `./preview`, `.`, `./react`)
- Deleted separate workspace packages; monorepo imports updated

## Phase 3 - Enterprise editor + React host plugin API

- Export from `@openenvx/canvas-driver/studio`: **`defineHostPlugin`** (name TBD) - React composition for full **workbench chrome** parity (views, toolbar, menu, status, commands, `registerViewPanel`) without exposing `Plugin` / DI
- Adapter wraps existing contribution classes internally
- Phase 3b: extend façade toward layer types / field renderers (today’s internal-only surface)

## Phase 4 - Done

- Legacy fat `*-studio` bundles removed from this repo
- Composable `@openenvx/studio` + `@openenvx/canvas-driver` publish stack documented for OSS hosts

## Publish note

When cutting a release: publish `@openenvx/studio`, `@openenvx/canvas-driver`, and `@openenvx/editor-sandbox` together from this repo.
