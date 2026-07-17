# Bleed / trim / crop marks — design

**Date:** 2026-07-17  
**Status:** Approved  
**Backlog:** FEATURES.md P1 — Bleed / trim / crop marks

## Goal

Full vertical slice: schema fields for bleed/safe, canvas print-guide overlays, and crop marks on SVG/PDF export when bleed > 0.

## Decisions

| Topic | Choice |
| --- | --- |
| Scope | Schema + overlay + SVG/PDF crop marks (no inspector UI) |
| Geometry model | Page `width`/`height` = **trim**; bleed/safe are insets; media box derived for export |
| Schema shape | Optional uniform `bleedMm` / `safeMm` on `Page` |
| Defaults | Print-eligible pages: bleed `3`, safe `10` when unset; else `0` |
| Print-eligible | Has preset (`presetId` or size match) **or** physical `unit` (not `px`) |
| Canvas | Artboard stays trim-sized; toggle shows safe dashed inset + trim-edge bleed line when bleed > 0; snap stays on safe only |
| Export | SVG/PDF wrap to media box + crop marks when bleed > 0; PNG/JPG stay trim-only |

## Architecture

1. **`@openenvx/schema`** — `bleedMm` / `safeMm` on Page; resolvers + `computePagePrintBoxes`.
2. **`@openenvx/canvas`** — replace `PRINT_MARGIN_MM` with schema resolvers; dual overlay (safe + bleed edge).
3. **`@openenvx/driver-image`** — `wrapTrimSvgWithCropMarks`; apply for client SVG export; IR page carries `bleedMm`.
4. **`apps/export-service`** — after IR render, wrap for svg/pdf when bleed > 0; header `x-export-bleed-mm`.

## Out of scope

Per-side insets, inspector fields, CMYK, PNG-with-marks flag, expanding stage chrome into the bleed area.
