# Bleed / Trim / Crop Marks Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Schema bleed/safe mm fields, canvas print overlays, and SVG/PDF crop marks when bleed > 0.

**Architecture:** Page size stays trim; `bleedMm`/`safeMm` resolve with defaults; canvas overlays use safe inset (+ trim-edge when bleed > 0); driver-image wraps trim SVG with marks; export-service applies wrap for svg/pdf only.

**Tech Stack:** Zod schema, Vitest, Konva canvas overlays, SVG string wrap in `@openenvx/driver-image`.

**Design:** [2026-07-17-bleed-trim-crop-marks-design.md](./2026-07-17-bleed-trim-crop-marks-design.md)

---

### Task 1: Schema print helpers + fields

**Files:**

- Create: `packages/schema/src/page-print.ts`
- Create: `packages/schema/src/page-print.test.ts`
- Modify: `packages/schema/src/types.ts`, `scene-schema.ts`, `index.ts`

**Steps:** TDD resolvers (`resolvePageBleedMm`, `resolvePageSafeMm`, `isPrintEligiblePage`, `computePagePrintBoxes`); add optional non-negative `bleedMm`/`safeMm` to Page Zod + types; export from index.

### Task 2: Canvas overlays

**Files:**

- Modify: `packages/canvas/src/page-margins.ts`, `page-margins.test.ts`
- Modify: `packages/canvas/src/hooks/use-canvas-overlays.ts`, `use-canvas-overlays.test.ts`
- Modify: stage/editor wiring for bleed overlay when showMargins

**Steps:** Replace `PRINT_MARGIN_MM` with schema safe resolver; add bleed-edge overlay rect; keep snap on safe only.

### Task 3: Crop-mark SVG wrap + client SVG export

**Files:**

- Create: `packages/driver-image/src/crop-marks.ts`, `crop-marks.test.ts`
- Modify: `svg-document-renderer.ts` / `image-document-export-service.ts`, `index.ts`

**Steps:** Implement `wrapTrimSvgWithCropMarks`; apply only for `format === 'svg'` when bleed > 0; PNG/JPG unchanged.

### Task 4: IR + export-service

**Files:**

- Modify: `packages/preview/src/render-ir.ts`, flatten-scene-to-ir, ir-document-renderer (optional), export-request schema, export-runner, app headers

**Steps:** Carry `bleedMm` on RenderIrPage; wrap svg/pdf in `runExport`; set `x-export-bleed-mm`.

### Task 5: FEATURES.md + verify

Update FEATURES.md status; run affected package tests.
