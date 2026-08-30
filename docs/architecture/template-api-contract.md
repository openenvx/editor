# Template API contract

Stable contract for building a cloud render API against OpenEnvx templates. Editor and server share `@xmazu/openenvxee-schema` helpers: `extractTemplateManifest`, `applyModifications`, and `validateTemplateNames`.

Pin clients to the scene `schemaVersion` (currently `4`). When the modification shape or resolution rules change incompatibly, bump `schemaVersion` and document the delta here.

Related implementation: [`packages/core/src/schema/template.ts`](../../packages/core/src/schema/template.ts) and [`packages/core/src/schema/template-variables.ts`](../../packages/core/src/schema/template-variables.ts).

## Concepts

| Term | Meaning |
| --- | --- |
| Template | A `Scene` whose editable layers have unique non-empty `name` values |
| Manifest | Public field list derived from named layers (`extractTemplateManifest`) |
| Modifications | Bannerbear-style payload: `modifications: Modification[]` keyed by `name` |
| Resolved scene | Result of `applyModifications(scene, modifications)` before render/export |

Names are unique per scene (across all pages and nested groups). The editor warns on duplicates via `validateTemplateNames`; the cloud API should reject requests when duplicates exist.

## Inline template variables (catalog + tokens)

Separate from named-layer modifications: a per-scene catalog `scene.variables` and `{{{key}}}` tokens stored in layer `data` string fields (text html, button labels, hrefs, …).

| Piece | API |
| --- | --- |
| Catalog | `scene.variables?: { id, key, label?, sample? }[]` |
| Substitute at render | `applyTemplateVariables(scene, values)` - HTML-escapes values; unknown keys stay as tokens |
| Editor preview | `applyTemplateVariablesForPreview(scene)` uses each variable's `sample` |
| Email export | `renderEmailHtml(scene, { variables?: Record<string, string> })` |

Bannerbear `Modification[]` and inline tokens can coexist on the same scene.

## TemplateManifest

```ts
interface TemplateManifest {
  schemaVersion: number;
  fields: TemplateField[];
}

interface TemplateField {
  name: string;
  kind: 'text' | 'image' | 'color' | 'qr';
  layerType: string; // e.g. canvas.text
  layerId: string;
  pageId: string;
  sample?: string; // plain text / URL / color from current layer data
}
```

Kind mapping:

| Layer type                     | `kind`                |
| ------------------------------ | --------------------- |
| `canvas.text`                  | `text`                |
| `canvas.qr`                    | `qr`                  |
| `canvas.image`                 | `image`               |
| `canvas.rect`, `canvas.circle` | `color`               |
| Other / unnamed                | omitted from manifest |

## Modification

```ts
interface Modification {
  name: string;
  text?: string; // plain text → canvas.text HTML, or canvas.qr data.url
  imageUrl?: string; // → canvas.image data.assetRef
  color?: string; // → text/shape data.fill, or canvas.qr data.foreground
  fontFamily?: string; // text only
  fontSize?: number; // text only (max / starting size when autoFit=shrink)
  hidden?: boolean; // → layer.visible = !hidden
}
```

Valid fields by kind:

| Kind    | Valid modification fields                                      |
| ------- | -------------------------------------------------------------- |
| `text`  | `text`, `color`, `fontFamily`, `fontSize`, `hidden`            |
| `qr`    | `text` (→ `data.url`), `color` (→ `data.foreground`), `hidden` |
| `image` | `imageUrl`, `hidden`                                           |
| `color` | `color`, `hidden`                                              |

Unknown `name` values are skipped (no error from `applyModifications`). Prefer validating against the manifest first in the cloud API.

## Resolution rules

1. Clone the template scene (do not mutate the stored template).
2. For each modification, find the first layer whose trimmed `name` matches.
3. Apply field mutations as above.
4. **Auto-fit and image-fit are layout/render-time**, not applied inside `applyModifications`:
   - Text shrink: when `data.autoFit === 'shrink'`, renderers call `fitFontSize(measureFn, boxHeight, minFontSize, fontSize)` so content stays inside the fixed transform box (`packages/canvas/src/fit-font-size.ts`).
   - Text box grow (editor / preview): after injecting copy, call `applyModificationsWithTextFit` from `@openenvx/canvas` (or `fitSceneCanvasTextToContent` on an already-resolved scene) so `transform.height` matches the wrapped content at the template width. Skips `autoFit: 'shrink'` and curved text. Pure `applyModifications` alone does not remasure.
   - Image: `data.fit` is `cover | contain | fill` with optional `data.focalPoint: { x, y }` in 0..1 (`packages/canvas/src/image-fit.ts`). Absent `fit` = legacy stretch (`fill`).
5. Export/render the resolved scene with the same fit algorithms so canvas preview and server output match. For cloud render of non-shrink text, remasure with `applyModificationsWithTextFit` (or equivalent) before rasterizing if the box should hug injected copy.

## Cloud API sketch

```http
POST /v1/templates/{templateId}/render
Content-Type: application/json

{
  "schemaVersion": 2,
  "modifications": [
    { "name": "headline", "text": "Hello world", "fontSize": 32 },
    { "name": "hero", "imageUrl": "https://cdn.example/photo.jpg" },
    { "name": "accent", "color": "#ff0000" },
    { "name": "badge", "hidden": true }
  ],
  "format": "png"
}
```

Server steps:

1. Load template `Scene`.
2. Optionally `GET` equivalent: return `extractTemplateManifest(scene)` for form builders.
3. If `validateTemplateNames(scene).duplicates.length > 0` → `400` with duplicate names.
4. Reject unknown modification names (recommended) or skip them.
5. `const resolved = applyModificationsWithTextFit(scene, modifications)` (or `applyModifications` then `fitSceneCanvasTextToContent` when you need the pure schema step separately).
6. Render resolved scene (reuse openenvx-cloud export-service). Honor shrink-to-fit and image fit during rasterization.

## End-to-end example

Template layers (named):

- `headline` - `canvas.text`, html `Hello`, `autoFit: 'shrink'`, box 320×80, fontSize 40
- `hero` - `canvas.image`, `fit: 'cover'`, focalPoint `{ x: 0.5, y: 0.2 }`

Manifest:

```json
{
  "schemaVersion": 2,
  "fields": [
    {
      "name": "headline",
      "kind": "text",
      "layerType": "canvas.text",
      "layerId": "…",
      "pageId": "…",
      "sample": "Hello"
    },
    {
      "name": "hero",
      "kind": "image",
      "layerType": "canvas.image",
      "layerId": "…",
      "pageId": "…",
      "sample": "https://…"
    }
  ]
}
```

Modifications:

```json
[
  { "name": "headline", "text": "A much longer headline that should shrink" },
  { "name": "hero", "imageUrl": "https://cdn.example/wide.jpg" }
]
```

Resolved scene: headline `data.html` becomes escaped paragraph text; hero `data.assetRef` updates. At render time the text font size shrinks to fit the box; the image covers the box around the focal point.

## Error cases

| Case | Recommended API behavior |
| --- | --- |
| Unknown modification `name` | `400` listing unknown names (or skip if you choose lenient mode) |
| Duplicate layer names in template | `400` - template invalid until renamed |
| Type mismatch (e.g. `imageUrl` on text) | Ignore irrelevant fields; do not fail |
| Missing template | `404` |
| `schemaVersion` newer than server | `409` / `422` unsupported version |

## Versioning

- Contract is tied to Scene `schemaVersion`.
- Additive optional modification fields may ship without a version bump.
- Removing/renaming fields or changing name-matching rules requires a `schemaVersion` bump and a new section in this doc.
