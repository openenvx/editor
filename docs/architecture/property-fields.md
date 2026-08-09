# Property field descriptors

**Audience:** Plugin authors, product hosts, and coding agents.

Hub: [Architecture.md](../../Architecture.md) · Workbench flow: [workbench-and-headless.md](workbench-and-headless.md).

Visual shell tokens (spacing, radii, control styling) live in [packages/workbench/Design.md](../../packages/workbench/Design.md) — that file is **design reference only**, not API documentation.

## What this is

Inspector and sidebar form fields are **descriptors** (`PropertyFieldDescriptor`) rendered by `@openenvx/workbench` field renderers. Plugins do not hand-roll inspector rows; they contribute panes via:

- `PropertyPaneContribution` + `createPropertyPane()` (`@openenvx/core`)
- `PropertyBuilder` on `LayerDefinition.properties()` (`@openenvx/core`)
- HTML `BlockConfig.fields` → mapped to the same descriptors in `@openenvx/html`

Types and JSDoc source of truth: `packages/core/src/builders/property-builder.ts`, `packages/core/src/builders/field-config.ts`.

## `PropertyFieldDescriptor`

| Property | Purpose |
| --- | --- |
| `key` | Stable id for the control and default `layer.data` path segment. |
| `kind` | Registered renderer id (`text`, `select`, `color`, …). |
| `label` | Human label; row label in `PropertyFieldRow` / block title in `PropertyFieldBlock`. |
| `icon` | Optional icon for popups or auxiliary UI. |
| `layout` | Inspector row layout — see below. |
| `debounceMs` | Delay writes to the scene (expensive preview). |
| `description` | Helper text under the control. |
| `placeholder` | Placeholder for text-like kinds. |
| `maxLength` | Max length for text-like kinds. |
| `options` | Choices for `select` / `segmented` / `align` (`value`, `label`, optional `icon`). |
| `repeaterFields` | Sub-fields for each row when `kind: 'repeater'`. |
| `slotList` | Template part + fields when `kind: 'slotList'` (HTML composite slots). |
| `uploadCommandId` | Command id for `image` upload. |
| `numeric` | `min`, `max`, `step`, `scrub`, `precision`, `unit` for numbers. |
| `popup` | Icon opens anchored popover with nested sub-fields. |
| `actions` | Trailing icon buttons (`setValue`, `toggle`, `command`). |

Pass the same options through `PropertyBuilder.*(key, label, config)` via `FieldConfigOptions` (third/fourth argument).

## `layout` (inspector field layout)

Controls how the workbench lays out label and control for a property field.

| Value | Row layout (`PropertyContentRenderer`) | Inner wrapper (`PropertyFieldControl`) |
| --- | --- | --- |
| omitted | `PropertyFieldRow` — variant depends on `kind` (`select` / `segmented` → inline; `toggle` / `checkbox` → switch; else stacked) | `FieldChrome` when the field has `popup` sub-fields or `actions` |
| `'inline'` | `PropertyFieldRow` inline — label beside control | `FieldChrome` when popup/actions present |
| `'stack'` | `PropertyFieldRow` default — label above control | `FieldChrome` when popup/actions present |
| `'block'` | `PropertyFieldBlock` — label **above**, full width | No `FieldChrome` wrapper |

Built-in kinds that default to `layout: 'block'` in `PropertyBuilder` include `repeater`, `slotList`, and `border` (full-width or multi-control fields).

**Examples:** Use `layout: 'inline'` on a `number` field when the label and scrub input should share one row (e.g. Columns). Use `layout: 'stack'` on a `select` to stack the label above the dropdown. Use `kind: 'segmented'` for short mutually exclusive choices shown as a button group (flex direction, wrap, etc.).

Implementation: `packages/workbench/src/renderers/property-content-renderer.tsx`, `property-field-control.tsx`.

## Field kinds (renderer registry)

Register custom kinds with `registerFieldRenderer` (`@openenvx/core`); defaults ship in `DefaultWorkbenchFieldsPlugin`.

| `kind` | Control | Typical use |
| --- | --- | --- |
| `text` | Text input | Short strings, URLs without media UI |
| `number` | Scrub / numeric input | Dimensions, gaps |
| `select` | Dropdown (`Select`) | Enums, font presets, named presets |
| `segmented` | Label button group (`SegmentedControl`) | Short layout toggles (direction, wrap) |
| `toggle` | Switch | Flags |
| `checkbox` | Checkbox | Multi-select flags |
| `color` | Swatch + popover | Fills, text color |
| `image` | Image field + optional upload | Assets |
| `richText` | TipTap | Long formatted text |
| `align` | Icon segmented control | Horizontal alignment |
| `font` | Font combobox | Canvas typography (`FontService`) |
| `repeater` | Full-width list | Plain object rows |
| `slotList` | Full-width part layers | HTML slot parts |
| `border` / `cornerRadius` / `padding` / `shadow` | Scrub + popup | Canvas style |

HTML `FieldDef` in `@openenvx/html` supports a subset; map advanced kinds via custom property panes or layer `properties()`.

## Pane layout (`PropertyPaneBuilder`)

Beyond single rows:

- `row(label, field, path?, options?)` — one `PropertyFieldDescriptor` bound to `PropertyPath.*`
- `inputGroup(blockLabel, cells, options?)` — horizontal group (e.g. X/Y, W/H)
- `block(label, build, options?)` — nested group of rows
- `when(clause)` / `priority(n)` / `headerToggle(path)` — **whole pane** visibility and section header switch

Paths use `PropertyPath` (`layerData`, `layerById`, transform paths via canvas host context, etc.).

### Conditional rows, blocks, and groups

Use the optional `options` argument: `{ when?: string }`. Same expression language as pane `.when` (`&&`, `||`, `!`, `==`, truthiness), but tokens come from two namespaces:

Parentheses are not supported. The evaluator splits on `||` first, then on `&&` within each segment (same rules as workbench context-key `when` on views and menus).

| Kind | Form | Example |
| --- | --- | --- |
| Context key | bare token | `scene.layerSelected`, `page.layoutAbsolute` |
| Property data | `$` + `PropertyValuePath` | `$selection.layer.data.shadowEnabled` |

Bare tokens are **never** read as property paths; `$…` tokens are **never** context keys. For a sibling field, use the same bind path with a `$` prefix. Helper:

```ts
PropertyPath.when(PropertyPath.layerData('shadowEnabled'));
// => '$selection.layer.data.shadowEnabled'
```

Example — show Blur only when Enabled is on; show Advanced block when layout is absolute and mode is advanced:

```ts
createPropertyPane('shadow', 'Shadow')
  .when('scene.layerSelected')
  .row('Enabled', toggleField, PropertyPath.layerData('shadowEnabled'))
  .row('Blur', numberField, PropertyPath.layerData('shadowBlur'), {
    when: PropertyPath.when(PropertyPath.layerData('shadowEnabled')),
  })
  .block(
    'Advanced',
    (b) => {
      b.row('Detail', textField, PropertyPath.layerData('detail'));
    },
    {
      when: `page.layoutAbsolute && ${PropertyPath.when(PropertyPath.layerData('mode'))} == 'advanced'`,
    }
  );
```

Visibility re-evaluates when property values change (live `readPath`) and when context keys change.

### Diagnostics (global editor debug)

Property `when` issues are hard to spot (bare path vs `$path`, wrong `layerById`, missing context key). Use **global editor diagnostics** — one flag for the whole workbench, not per-feature keys.

| Enable | How |
| --- | --- |
| App default | `WorkbenchController({ debug: import.meta.env.DEV })` when `localStorage` unset |
| Browser | `localStorage.setItem('openenvx:debug', '1')` or `'0'` to force off |
| Runtime | `api.setEditorDebug(true)` / `api.isEditorDebug()` |

With diagnostics on, the console shows:

- **`[OpenEnvx] property.when`** — unknown context keys (with “did you mean”), bare `selection.layer…` tokens (suggest `$…`), unresolved `$` paths, and collapsed summaries when a clause hides a row/block (`primaryLayerId`, token resolutions).
- **`[OpenEnvx] property.field`** — invalid field descriptors validated with per-kind Zod `strictObject` schemas when a pane row or `PropertyBuilder` field is assembled. **Error** for missing required props (e.g. `select` without `options`). **Warn** for props not used by that kind (e.g. `numeric` on `segmented`). **Info** for soft hints (e.g. `image` without `uploadCommandId`). Custom field kinds (`kind` not in the built-in set) skip strict unused-key checks.

Example — `numeric` on `segmented` is ignored at render time; with diagnostics on you get a warn suggesting `number` or `cornerRadius`:

```ts
.row('Corner radius', {
  key: 'borderRadius',
  kind: 'segmented',
  label: 'Radius',
  numeric: { max: 48, min: 0, step: 1, unit: 'px' },
});
```

**Bind vs `when`:** row `path` (3rd arg) is where data is read/written; `field.key` is the control id and defaults to `selection.layer.data.{key}` only when `path` is omitted. For `PropertyPath.layerById('event-gallery', 'layoutPreset')`, use that path on the row and `PropertyPath.when(...)` in `{ when }`.

Layer `properties()` sections (`PropertyBuilder` on canvas/HTML layer definitions) support per-field `when` via the optional config on each field method (same expression language). The factory maps `field.when` onto synthesized `PropertyRowNode` instances.

## Related

- [workbench-and-headless.md](workbench-and-headless.md) — contribution flow, host rules
- [html.md](html.md) — block `FieldDef` mapping
- [packages/workbench/Design.md](../../packages/workbench/Design.md) — visual design tokens only
