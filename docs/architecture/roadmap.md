# OpenEnvx product roadmap (packages & APIs)

Companion to [Architecture.md](../../Architecture.md). This tracks intentional follow-ups after the `@xmazu/openenvxee-extensions` merge.

## Phase 1 — Done

- Merge `@xmazu/openenvxee-protocol`, `@openenvx/elements`, `@openenvx/widget-sdk` → **`@xmazu/openenvxee-extensions`**
- Sunset embed / `plugin-panel` host lane from product surface
- Consolidate author docs under `docs/architecture/`

## Phase 2 — Done

- Merged `@openenvx/headless`, `@xmazu/openenvxee-schema`, and `@xmazu/openenvxee-preview` into private **`@openenvx/core`** (`./schema`, `./preview`, `.`, `./react`)
- Deleted separate workspace packages; monorepo imports updated

## Phase 3 — Enterprise editor + React host plugin API

- Export from `@xmazu/openenvxee-studio`: **`defineHostPlugin`** (name TBD) — React composition for full **workbench chrome** parity (views, toolbar, menu, status, commands, `registerViewPanel`) without exposing `Plugin` / DI
- Adapter wraps existing contribution classes internally
- Phase 3b: extend façade toward layer types / field renderers (today’s internal-only surface)

## Phase 4 — Align published html-studio

- `@xmazu/openenvxee-html-studio` uses the same host-plugin story as canvas studio
- Narrow accidental `export *` from core/headless on the published HTML bundle

## Publish note

When cutting a release: publish `@xmazu/openenvxee-extensions` and `@xmazu/openenvxee-html-studio` only. Bump product repos in the same window.
