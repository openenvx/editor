# HTML editor: on-canvas image replace (design)

**Status:** Implemented 2026-08-04 (pill + drop/click; slot faces; gallery via `html.image` slots)  
**Package:** `@openenvx/html` (generic); Snapvelo demo consumes it  
**Related:** Snapvelo event-page demo; `AssetService.upload`

## Goal

Let organizers replace images from the HTML editor surface — selection-pill **Replace image** plus drop/click on the image — using `AssetService`, not inspector-only URL fields. Works for built-in blocks (`html.image`, `html.hero` background) and product composites (e.g. Snapvelo event page).

## Decisions

| Topic | Choice |
| --- | --- |
| Interaction | **B** — pill Replace + drop/click on surface |
| Storage | `AssetService.upload(file)` → write returned ref into the image field |
| Which blocks | **A** — any `BlockConfig` with an `image` field (heuristic primary key) |
| Implementation | Editor chrome wraps selected block; authors do not add upload UI in `render` |
| Slots | Drop on an `html.image` slot face writes nested path on the host (`slots.<key>.<i>.data.src`); host pill still replaces host primary image field |

## Primary image field heuristic

From `BlockConfig.fields`, first match:

1. `src` with `kind: 'image'`
2. `backgroundImage` with `kind: 'image'`
3. First field with `kind: 'image'`

## Data flow

```text
file (picker or drop)
  → AssetService.upload(file)   // optional; hide UX if missing
  → updateProperty(layerId, fieldPath, ref)
  → render via existing src / CSS background (resolveUrl when displaying asset://)
```

## UX

- **Pill:** When selected layer has a primary image field and `upload` exists → “Replace image” → file input `image/*`.
- **Surface:** Selected block chrome accepts image drag-drop with highlight; selected overlay allows click-to-replace without stealing the first click used for selection (select first, then replace affordance).
- **Missing upload:** Hide Replace; ignore drop. Inspector URL still works.
- **Upload failure:** Do not write; v1 no toast required.

## Non-goals (v1)

- Host-specific CDN upload API beyond `AssetService`
- Opt-in `replaceableImage` BlockConfig flag
- Multi-image field picker UI (only primary / explicit slot hit)
- Changing Snapvelo product blocks beyond consuming the HTML feature

## Placement

| Piece | Where |
| --- | --- |
| Primary-field helper | `packages/html/src/editor/` |
| Pill action | `block-selection-menu.tsx` + `BlockChrome` |
| Drop / click overlay | HTML editor chrome around selected block / slot image face |
| Asset wiring | `HtmlEditorPane` / block editor context via existing DI `AssetServiceId` |

## Follow-ups

- Inspector `ImageInput` file button wired to same `upload` path
- Resolve `asset://` in all HTML image/background renders consistently
