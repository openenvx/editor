---
"@openenvx/schema": minor
"@openenvx/canvas": minor
"@openenvx/core": minor
---

Move page size presets and absolute page rules out of `@openenvx/schema` into `@openenvx/canvas` / page-rules contributions. Schema no longer exports `PAGE_SIZE_PRESETS`, `resolvePagePreset`, `findPresetForPage`, or `getDefaultPageDimensions`; `normalizeScene` no longer fills absolute dimensions or infers `presetId`.
