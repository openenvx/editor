# Property field descriptors

**Audience:** Plugin authors, product hosts, and coding agents.

Hub: [Architecture.md](../../Architecture.md) · Workbench flow: [workbench-and-headless.md](workbench-and-headless.md).

Visual shell tokens (spacing, radii, control styling) live in [packages/workbench/Design.md](../../packages/workbench/Design.md) — that file is **design reference only**, not API documentation.

## What this is

Inspector and sidebar form fields are **descriptors** (`PropertyFieldDescriptor`) rendered by `@openenvx/workbench` field renderers. Plugins do not hand-roll inspector rows; they contribute panes via:

- `PropertyPaneContribution` + `createPropertyPane()` (`@openenvx/headless`)
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
| `chrome` | Inspector row layout and inner `FieldChrome` wrapper — see below. |
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

## `chrome` (inspector field layout)

**Not** editor toolbar chrome, HTML block selection chrome, or canvas chrome. This flag only affects **how the workbench lays out a property field**.

| Value | Row layout (`PropertyContentRenderer`) | Inner wrapper (`PropertyFieldControl`) |
| --- | --- | --- |
| omitted / `true` | `PropertyFieldRow` — variant depends on `kind` (e.g. `select` / `segmented` → label beside control) | `FieldChrome` when the field has `popup` sub-fields or `actions` |
| `false` | `PropertyFieldBlock` — label **above**, full width | No `FieldChrome` wrapper |

Built-in kinds that default to `chrome: false` in `PropertyBuilder` include `repeater`, `slotList`, and `border` (full-width or multi-control fields).

**Example:** `kind: 'select'` is always a dropdown. Use `chrome: false` to stack the label above the control (typography pickers in product sidebars). Use `kind: 'segmented'` for short mutually exclusive choices shown as a button group (flex direction, wrap, etc.).

Implementation: `packages/workbench/src/renderers/property-content-renderer.tsx`, `property-field-control.tsx`.

## Field kinds (renderer registry)

Register custom kinds with `registerFieldRenderer` (`@openenvx/headless`); defaults ship in `DefaultWorkbenchFieldsPlugin`.

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

- `row(label, field, path?)` — one `PropertyFieldDescriptor` bound to `PropertyPath.*`
- `inputGroup(blockLabel, cells)` — horizontal group (e.g. X/Y, W/H)
- `block(label, build)` — nested group of rows
- `when(clause)` / `priority(n)` / `headerToggle(path)` — pane visibility and section header switch

Paths use `PropertyPath` (`layerData`, `layerById`, transform paths via canvas host context, etc.).

## Related

- [workbench-and-headless.md](workbench-and-headless.md) — contribution flow, host rules
- [html.md](html.md) — block `FieldDef` mapping
- [packages/workbench/Design.md](../../packages/workbench/Design.md) — visual design tokens only
