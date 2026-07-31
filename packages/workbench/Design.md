# OpenWorkbench — Design Specification

Designing the `@xmazu/openenvxee-workbench` React UI for canvas/flow editor authors on **web**.

**Goal:** A composable, performant editor shell that feels as precise and polished as [shadcn/designer](https://ds.shadcn.com/) — without importing shadcn, Radix, or Tailwind.

**Tone:** Architectural monochrome, quiet premium, tool-native. Not generic SaaS dark mode.

**Primary reference:** [shadcn/designer editor example](https://ds.shadcn.com/examples/editor) — **1:1 visual lock** (Yellowstone demo store)  
**Grammar reference:** [shadcn/ui](https://ui.shadcn.com) zinc dark palette, inset rings — not component imports  
**Secondary reference:** Framer / Artboard Studio editor screens (Refero) — three-column canvas layout patterns

**Status (v3):** Tokens, layout chrome, property panes (Layout → Layer → Styles → Transforms), sidebar segments, layer tree, floating toolbar, and canvas-demo scene aligned to reference screenshot. Primary and secondary side bars share `ViewPane` + `ViewContainerViews`. **Inspector** is only the default secondary container that hosts canvas layer/node property views.

---

## Research summary

| Layer | Reviewed | Takeaway |
| --- | --- | --- |
| Styles | shadcn/ui, Linear dark | shadcn owns component grammar (10px inputs, inset rings, achromatic hierarchy); Linear owns quiet dark density |
| Screens | Framer, Artboard Studio, Glorify, Modyfi | Pro editors share: slim top bar, tabbed left rail, centered white artboard, right inspector with sectioned properties, floating bottom toolbar |
| Product | shadcn/designer | Composable shell (`Designer`, `DesignerPane`, `Action*`), CSS-var layer model, hook-driven actions — our architecture should mirror this separation even if APIs differ |

---

## Reference lock

```
Primary reference/direction: shadcn/designer editor (dark chrome + white artboard)
Preserve:
  - Three-column editor anatomy (layers | canvas | inspector)
  - Achromatic UI chrome; color only for canvas selection + semantic states
  - 10px control radius, inset 1px ring elevation (not drop shadows)
  - Compact 12–13px UI type, muted labels, mono for numeric fields
  - Floating bottom toolbar pill on canvas (not full-width chrome row)
  - White artboard as the visual hero; chrome recedes

Borrow only:
  - Linear dark: border-only depth, no glow, slim 36px top bar rhythm
  - Framer: collapsible inspector sections, layer row density

Role rules:
  - Blue (#3b82f6): canvas selection handles, dimension badge, active transform state ONLY
  - Chrome buttons (Menu, Export): muted zinc fill (#27272a), 28px height, chevron trailing — NOT solid white CTA
  - White/neutral ring: focus states on inputs and icon buttons
  - Unified black (#09090b): top bar, sidebars, inspector — same surface as app root
  - Canvas field (#111113): slightly lifted from chrome; white artboard is the hero
  - Muted gray (#a1a1aa): labels, inactive icons, chevrons
  - Never use accent blue for panel backgrounds, tab fills, or button defaults

Media strategy:
  - Artboard: solid white fill, optional subtle outer shadow
  - Canvas workspace: flat neutral field (#0c0c0c → #141414), no checkerboard in v1
  - Layer thumbnails/icons: lucide stroke icons, 14px, muted

Reject:
  - Linear-midnight flat gray panels with no elevation hierarchy (current)
  - 6px radius everywhere (reads Bootstrap, not shadcn)
  - Blue focus rings on every input (reads generic Tailwind)
  - Full-width legacy toolbar row in canvas mode
  - Decorative gradients, purple accents, warm cream palettes
```

---

## Gap analysis: current vs target

| Area | Current (`tokens.css`) | Target (shadcn/designer) | Fix |
| --- | --- | --- | --- |
| **Surface hierarchy** | 3 flat grays (`#08090a`, `#121212`, `#1a1a1a`) | Chrome slightly lighter than canvas field; panels use inset ring not fill contrast | Add `--wb-popover`, `--wb-muted`; use ring shadows |
| **Radius** | 4/6/8px | 8px panels, **10px inputs/buttons**, pill segments | Bump `--wb-radius-control: 10px` |
| **Elevation** | `border: 1px solid` only | `box-shadow: 0 0 0 1px …` inset rings (shadcn card pattern) | Replace hard borders on inputs/cards with rings |
| **Accent** | Blue focus + blue selection + blue tab potential | Blue **canvas-only**; focus = white/neutral ring | Split `--wb-ring` from `--wb-selection` |
| **Typography** | 11–12px, no scale | 12px body, 11px caption, mono for X/Y/W/H | Formal type scale tokens |
| **File menu** | Activity bar dropdown | Theme, Save, Open, Export via descriptor menu | `ActivitySidebar` + `DropdownMenuRenderer` |
| **Inspector** | Basic label + input rows | Layout / Layer / Styles / Transforms sections | `createPropertyPane` + property renderer |
| **Canvas** | No dimension badge | Blue `W × H px` label on selection | `canvas-stage.tsx` Konva Label |
| **Demo scene** | Generic shapes | 1080×1920 Yellowstone image + text + rotated group | `createCanvasDemoScene()` |

---

## Token system (v3 — current)

All tokens live in [`src/theme/tokens.css`](src/theme/tokens.css). The file defines two built-in scopes — `[data-owb-theme="light"]` (default) and `[data-owb-theme="dark"]` — plus a shared `[data-owb-theme]` layer for theme-agnostic layout, spacing, radius, and font tokens.

### Light theme (default)

Light mode inverts the dark reference: **soft zinc chrome**, a **darker canvas field**, and a **white artboard** as the brightest surface. Blue is reserved for canvas selection and layer-tree selection tint — never for panel chrome.

| Token | Value | Role |
| --- | --- | --- |
| `--wb-background` | `#f6f6f8` | App root, top bar, sidebars, inspector |
| `--wb-canvas-field` | `#e4e4e9` | Infinite canvas workspace — darker than chrome |
| `--wb-card` | `#ffffff` | Elevated inset surfaces inside panels |
| `--wb-popover` | `#ffffff` | Floating toolbar, menus, popovers |
| `--wb-muted` | `#ececef` | Inputs, segment track, zoom trigger |
| `--wb-chrome-button` | `#ffffff` | Menu button on grey chrome |
| `--wb-sidebar-row-selected` | `#dbeafe` | Layer tree selection pill (blue tint) |
| `--wb-border` | `#d4d4d8` | Structural dividers |
| `--wb-foreground` | `#18181b` | Primary text |
| `--wb-muted-foreground` | `#71717a` | Labels, captions, icons |
| `--wb-primary` | `#18181b` | Export CTA fill |
| `--wb-primary-foreground` | `#fafafa` | Text on Export CTA |
| `--wb-selection` | `#3b82f6` | Canvas selection ONLY |
| `--wb-artboard` | `#ffffff` | Artboard fill |

### Dark theme

| Token | Value | Role |
| --- | --- | --- |
| `--wb-background` | `#09090b` | App root, top bar, sidebars, inspector |
| `--wb-canvas-field` | `#111113` | Infinite canvas workspace |
| `--wb-card` | `#18181b` | Elevated inset surfaces |
| `--wb-popover` | `#1c1c1f` | Floating toolbar, menus, popovers |
| `--wb-muted` | `#27272a` | Inputs, segment track, zoom trigger |
| `--wb-chrome-button` | `#27272a` | Menu / Export buttons |
| `--wb-sidebar-row-selected` | `#3f3f46` | Layer tree selection pill |
| `--wb-border` | `#3f3f46` | Structural dividers |
| `--wb-foreground` | `#fafafa` | Primary text |
| `--wb-muted-foreground` | `#a1a1aa` | Labels, captions, icons |
| `--wb-primary` | `#fafafa` | Export CTA fill |
| `--wb-primary-foreground` | `#09090b` | Text on Export CTA |
| `--wb-selection` | `#3b82f6` | Canvas selection ONLY |
| `--wb-artboard` | `#ffffff` | Artboard fill |

### Control metrics

| Token                          | Value   | Use                            |
| ------------------------------ | ------- | ------------------------------ |
| `--wb-control-height`          | `28px`  | Inputs, buttons, selects       |
| `--wb-radius-control`          | `8px`   | Inputs, buttons, segments      |
| `--wb-topbar-height`           | `40px`  | Top chrome (legacy / optional) |
| `--wb-activity-bar-width`      | `56px`  | Left icon rail with labels     |
| `--wb-sidebar-width`           | `240px` | Side panel beside activity bar |
| `--wb-secondary-sidebar-width` | `280px` | Secondary side bar (right)     |
| `--wb-icon-button-size-lg`     | `32px`  | Floating toolbar icons         |

### Theme-aware alpha tokens

Color values are fully inverted between light and dark scopes. The following alpha tokens flip between white and black overlays so that hover states, dividers, and shadows remain subtle in both directions.

| Token | Dark value | Light value | Use |
| --- | --- | --- | --- |
| `--wb-hover-overlay` | `rgb(255 255 255 / 4%)` | `rgb(0 0 0 / 4%)` | Hover backgrounds on transparent controls |
| `--wb-active-overlay` | `rgb(255 255 255 / 6%)` | `rgb(0 0 0 / 6%)` | Pressed/active backgrounds |
| `--wb-divider-color` | `rgb(255 255 255 / 8%)` | `rgb(0 0 0 / 8%)` | Structural dividers |
| `--wb-border-subtle` | `rgb(255 255 255 / 12%)` | `rgb(0 0 0 / 12%)` | Subtle borders on elevated surfaces |
| `--wb-backdrop-overlay` | `rgb(0 0 0 / 60%)` | `rgb(0 0 0 / 60%)` | Modal/overlay backdrops |

### Control shadows (inputs, selects, switches)

Form controls use `--wb-shadow-control` at rest and `--wb-shadow-control-focus` on focus — not `--wb-shadow-xs` / `--wb-shadow-focus` directly.

| Token | Light | Dark |
| --- | --- | --- |
| `--wb-shadow-control` | `none` | `0 0 0 1px rgb(255 255 255 / 6%)` |
| `--wb-shadow-control-hover` | `none` | `0 0 0 1px rgb(255 255 255 / 10%)` |
| `--wb-shadow-control-focus` | `0 0 0 4px #e5e5e5` | double ring via `--wb-background` |
| `--wb-shadow-focus` | `0 0 0 4px #e5e5e5` | double ring via `--wb-background` |

Light inputs are **borderless at rest** (muted fill only). Focus shows a soft outer gray halo — no inner stroke.

---

## Runtime theming

`WorkbenchShell` accepts a `theme` prop. Built-in values are `'light'` and `'dark'`. The default is `'light'`. Any other string is treated as a custom theme name and exposed via `data-owb-theme` on the shell DOM and on Radix portal content (dropdowns, popovers, selects, tooltips).

Users can switch between built-in themes from **File → Theme** in the activity sidebar. The shell keeps theme state internally and calls `onThemeChange` when the selection changes.

```tsx
import { WorkbenchShell } from '@xmazu/openenvxee-workbench';
import '@xmazu/openenvxee-workbench/theme.css';

<WorkbenchShell
  onThemeChange={(theme) => localStorage.setItem('owb-theme', theme)}
  plugins={plugins}
  theme="dark"
/>;
```

Custom themes are added by consumers in their own CSS. No workbench code changes are required.

```css
[data-owb-theme='brand'] {
  --wb-background: #0f172a;
  --wb-foreground: #f8fafc;
  --wb-canvas-field: #1e293b;
  --wb-muted: #334155;
  --wb-border: #475569;
  --wb-selection: #38bdf8;
}
```

```tsx
<WorkbenchShell theme="brand" plugins={plugins} />
```

Portals render outside the shell DOM tree, so the active theme is propagated through `ThemeProvider` / `useThemeScope`. The canvas package reads the same CSS variables for the artboard fill, page border, and selection handles via `useCanvasThemeColors`.

---

## Design thesis

OpenWorkbench workbench UI should feel like **shadcn/ui was built for Figma** — not like a VS Code fork painted dark.

The product is the **white artboard**. Everything else is scaffolding: thin, precise, and visually quiet. Users should feel the same confidence as [shadcn/designer's demo editor](https://ds.shadcn.com/examples/editor): every control is intentional, every pixel aligned to an 8px grid, no visual noise.

We achieve shadcn aesthetics **through tokens and CSS modules**, not by adding shadcn as a dependency. The grammar is what we copy; the components are ours.

---

## Token system (v2 — superseded reference)

All tokens live in [`src/theme/tokens.css`](src/theme/tokens.css). Scope: `[data-owb-theme="dark"]`.

### Color roles

| Token | Value | Role |
| --- | --- | --- |
| `--wb-background` | `#0a0a0a` | App root |
| `--wb-canvas-field` | `#111111` | Infinite canvas workspace |
| `--wb-card` | `#171717` | Panel surface (sidebar, inspector) |
| `--wb-popover` | `#1c1c1c` | Floating toolbar, menus, popovers |
| `--wb-muted` | `#262626` | Segment inactive, input bg, hover |
| `--wb-border` | `#2e2e2e` | Structural dividers only |
| `--wb-ring` | `#ffffff` @ 20% | Focus ring, inset elevation |
| `--wb-foreground` | `#fafafa` | Primary text |
| `--wb-muted-foreground` | `#a3a3a3` | Labels, captions, icons |
| `--wb-primary` | `#fafafa` | Primary button text on dark fill |
| `--wb-primary-foreground` | `#0a0a0a` | Text on primary button |
| `--wb-selection` | `#3b82f6` | Canvas selection handles ONLY |
| `--wb-artboard` | `#ffffff` | Artboard fill |
| `--wb-destructive` | `#dc2626` | Delete, error |

### Typography

| Token            | Size | Weight | Use                      |
| ---------------- | ---- | ------ | ------------------------ |
| `--wb-text-xs`   | 11px | 400    | Field labels, layer meta |
| `--wb-text-sm`   | 12px | 400    | Body, tree items         |
| `--wb-text-base` | 13px | 500    | Section headers          |
| `--wb-text-mono` | 12px | 400    | X, Y, W, H, zoom %       |

**Font stack:** `Geist, Inter, system-ui, sans-serif`  
**Mono stack:** `Geist Mono, ui-monospace, monospace`

Letter-spacing: `-0.01em` on headings ≥13px.

### Spacing (8px grid)

| Token            | Value |
| ---------------- | ----- |
| `--wb-space-0.5` | 2px   |
| `--wb-space-1`   | 4px   |
| `--wb-space-2`   | 8px   |
| `--wb-space-3`   | 12px  |
| `--wb-space-4`   | 16px  |
| `--wb-space-5`   | 20px  |
| `--wb-space-6`   | 24px  |

### Radius

| Token                 | Value  | Use                           |
| --------------------- | ------ | ----------------------------- |
| `--wb-radius-sm`      | 6px    | Badges, small chips           |
| `--wb-radius-md`      | 8px    | Panels, sections              |
| `--wb-radius-control` | 10px   | Inputs, buttons, icon buttons |
| `--wb-radius-lg`      | 12px   | Floating toolbar shell        |
| `--wb-radius-full`    | 9999px | Segment pills, zoom chip      |

### Elevation (inset rings — shadcn pattern)

```css
--wb-shadow-xs: 0 0 0 1px rgb(255 255 255 / 6%);
--wb-shadow-sm: 0 0 0 1px rgb(255 255 255 / 8%);
--wb-shadow-md: 0 1px 2px rgb(0 0 0 / 40%), 0 0 0 1px rgb(255 255 255 / 6%);
--wb-shadow-float: 0 8px 24px rgb(0 0 0 / 50%), 0 0 0 1px rgb(255 255 255 / 8%);
--wb-shadow-focus:
  0 0 0 2px var(--wb-background), 0 0 0 4px rgb(255 255 255 / 30%);
```

Use `--wb-shadow-xs` on inputs at rest. Use `--wb-shadow-float` only on floating toolbar and popovers — never on static panels.

### Layout constants

| Token                          | Value |
| ------------------------------ | ----- |
| `--wb-topbar-height`           | 36px  |
| `--wb-sidebar-width`           | 240px |
| `--wb-secondary-sidebar-width` | 280px |
| `--wb-layer-row-height`        | 28px  |
| `--wb-icon-button-size`        | 32px  |

---

## Layout anatomy

```
┌──┬──────────┬─────────────────────────────┬───────────────┐
│▪│ Layers   │                             │ Inspector     │
│▪│ panel    │      CanvasField            │ 280px         │
│ │          │   ┌─────────────────────┐   │               │
│F│ ◇ Image  │   │   White Artboard    │   │ ▾ Layout      │
│ │ ◇ Text   │   └─────────────────────┘   │ ▾ Layer       │
│ │          │        ┌──────────────┐     │ ▾ Styles      │
│ │          │        │ ↩ ↪ … 31%  │     │               │
│ │          │        └──────────────┘     │               │
│ │          │         FloatingToolbarRenderer │               │
├──┴──────────┴─────────────────────────────┴───────────────┤
│ 31% zoom          Saved              Rect · 95 × 80      │
└───────────────────────────────────────────────────────────┘
```

### Regions

| Region | Component | Notes |
| --- | --- | --- |
| ActivityBar | `ActivitySidebar` (icon rail) | 56px; icon + label per item; active icon uses `--wb-muted` fill |
| Primary Side Bar | `ActivitySidebar` (panel body) | 240px; title header + scrollable `ViewPane` content |
| CanvasField | `CanvasChrome` | `--wb-canvas-field` bg; artboard centered |
| FloatingToolbar | `FloatingToolbarRenderer` | Bottom-center overlay; contribution-driven tools + widgets |
| Secondary Side Bar | `ViewContainerViews` + `ViewPane` | 280px; default **Inspector** container (`workbench.inspector`) hosts canvas layer/node property views; same view chrome as primary |
| StatusBar | `StatusBarRenderer` | 24px; zoom, dirty/saved, selection summary |

---

## Component specifications

### Button

| Variant | Background | Border/Ring | Text | Radius |
| --- | --- | --- | --- | --- |
| `default` | `#fafafa` | none | `#0a0a0a` | 10px |
| `ghost` | transparent | none | `--wb-muted-foreground` → `--wb-foreground` on hover | 10px |
| `outline` | transparent | `--wb-shadow-xs` | `--wb-foreground` | 10px |
| `icon` | transparent | none | muted → foreground | 10px, 32×32 |

Height: 32px default, 28px sm. No colored fills except `default` (Export CTA).

### Input / NumberInput

- Height: 32px
- Background: `--wb-muted`
- Rest: `--wb-shadow-control` (light: none; dark: inset ring)
- Radius: 10px
- Padding: 4px 10px
- Focus: `--wb-shadow-control-focus` (light: soft gray halo; dark: double ring)
- NumberInput: right-aligned mono, used in X/Y/W/H pairs

### StepperField

Compound numeric control used inside property popovers:

```
Top     [↓ 0        ] [+] [-]
```

- Row: fixed left label column + flexible input + two 28px step buttons
- Input: muted field surface, mono value, optional directional/corner icon inside the field
- Step buttons: same muted surface as the input, same control height, same focus ring
- Used for: `Padding`, `Radius`, `Shadow` popup rows

### InputGroup (new)

Horizontal compound control for paired values:

```
┌─────────┬─────────┐
│ X  540  │ Y  960  │
└─────────┴─────────┘
```

- Shared outer ring
- Inner vertical divider `1px solid rgb(255 255 255 / 6%)`
- Each cell: label prefix (muted, 11px) + mono value

### SegmentedControl

- Container: `--wb-muted` bg, 4px padding, `--wb-radius-full`
- Active segment: `--wb-card` bg + `--wb-shadow-xs`
- Text: 11px, weight 500
- Used for: Auto/Flex, Yes/No, sidebar-adjacent toggles

### Tabs (sidebar)

Radix Tabs primitive (`primitives/tabs.tsx`) — full-width pill segments in the secondary sidebar header:

- Track: `--wb-muted` bg, 3px padding, `--wb-radius-md`
- Trigger height: 24px; active: `--wb-card` + `--wb-shadow-xs`
- Equal-width triggers; inactive content kept mounted (`forceMount` + CSS hide)
- Used for secondary view containers (e.g. Inspector \| Version)
- No bottom border on the tab row

`SegmentedControl` remains for inspector field toggles (Auto/Flex, etc.) — not for sidebar tabs.

### PanelSection (inspector)

- Header: 13px weight 500, chevron 10px, padding 12px 16px
- No background change on hover — only chevron rotates
- Body: padding 0 16px 16px
- Sections separated by `1px solid rgb(255 255 255 / 4%)` (hairline, not `--wb-border`)

### LayerTreeRow (new)

```
[▾] [icon] Label                    [🔒]
```

- Height: 28px
- Padding-left: `8 + depth * 8` px (`--wb-tree-base-padding` + depth × `--wb-tree-indent`)
- Selected: `--wb-muted` bg + `--wb-shadow-xs` inset
- Hover: `--wb-muted` @ 50%
- Icons: 14px lucide, `--wb-muted-foreground`
- Label: 12px, truncate

### FloatingToolbarRenderer

- Background: `--wb-popover`
- Ring: `--wb-shadow-float`
- Radius: 12px
- Padding: 4px
- Icon buttons: 32px, ghost variant
- Dividers: 1px × 20px, `rgb(255 255 255 / 8%)`
- Zoom chip: mono 11px, ghost, min-width 44px

### PropertyPopover

Popup shell for per-side/per-corner/per-shadow controls:

- Width: ~508px max, clamped to viewport
- Radius: 12px shell
- Light surface: `#ffffff`
- Dark surface: near-black (`--wb-property-popover`), darker than standard dropdown popovers
- Header: 16px vertical / 20px horizontal padding, 13px semibold title, hairline divider
- Body: 16px top / 20px sides / 20px bottom
- Layout: vertical stack; color picker block renders first when present, then stepper rows

### ColorPickerPopover

- Uses the same `PropertyPopover` shell
- Large inline square color well followed by a hue rail
- Hex input sits directly below the picker inside the same panel
- No nested micro-card styling when rendered inside an property popup

### Canvas / Artboard

- **Canvas field:** `--wb-canvas-field`, no padding
- **Artboard:** white, `box-shadow: 0 4px 24px rgb(0 0 0 / 35%)`
- **Selection:** `#3b82f6` stroke, 1px handle squares (Konva Transformer config)
- **Size tooltip:** dark popover pill near selection (`0 × 0 px` in reference)

---

## Property panes (form content inside a view)

Map to shadcn/designer `DesignerPane` + `Action*` pattern conceptually. Each pane is a `PropertyPaneDescriptor` rendered inside a `View` (primary or secondary).

### Field kinds (author once, reuse everywhere)

Property form controls are **descriptor → registered renderer**, not ad-hoc JSX in plugins. Author properties with `PropertyBuilder` (canvas) or HTML `FieldDef` → `createHtmlLayerDefinition` (maps onto the same builders). Prefer these kinds over inventing new inputs:

| Kind | Control | Use for |
| --- | --- | --- |
| `text` | Compact text input | Short strings, URLs without media chrome |
| `number` | Scrub / NumberInput | Dimensions, gaps, sizes |
| `select` | Select | Discrete enums (H1–H4, fit mode) |
| `toggle` | Switch (pill) | Optional visibility, flags |
| `checkbox` | Checkbox (square) | Multi-select flags, list row booleans |
| `color` | Color swatch + popover | Fill, overlay, text color |
| `image` | Image input (+ optional upload) | Backgrounds, media refs — **not** a plain text URL field |
| `richText` | TipTap-backed rich text | Body / heading content |
| `align` | Icon segmented control | left / center / right |
| `font` | Font combobox | Canvas typography |
| `repeater` | Full-width list of plain object rows | Simple multi-value data |
| `slotList` | Full-width list of **part layers** | Composite HTML slots (CTAs); sub-fields are the part type’s own kinds |
| `border` / `cornerRadius` / `padding` / `shadow` | Scrub + popup | Canvas style chrome |

Rules:

- **Do not** hand-roll property rows with outline “Add/Remove” buttons and stacked labels — use `PropertyFieldRow` / `PropertyFieldBlock` + registered kinds.
- Fields with `chrome: false` (`repeater`, `slotList`) render as a **block** (label above, full width), not a cramped 56px label row.
- Slot list rows: muted surface + inset ring (`--wb-muted` / `--wb-shadow-control`), header + ghost `IconButton` (trash / plus) — same grammar as layer-tree trailing actions.
- HTML `BlockConfig.fields` should pick the kind from this table; composites generate slot inspector sections from each part type’s fields (re-keyed under `slots.<name>…`).

### Layout pane

| Field | Control | Notes |
| --- | --- | --- |
| Display | SegmentedControl `Auto \| Flex` | Phase 2 — needs layer descriptors |
| Direction | Icon toggle pair (→ ↓) | Phase 2 |
| Align / Justify | Icon button groups | Phase 2 |
| Wrap | SegmentedControl `Yes \| No` | Phase 2 |
| Gap | NumberInput |  |
| Padding | StepperField popup (T/R/B/L) | Bound to `layer.data.padding`; directional icon inside the field |

### Layer pane

| Field    | Control                        |
| -------- | ------------------------------ |
| Position | InputGroup X/Y (scrub numeric) |
| Size     | InputGroup W/H (scrub numeric) |

Bind to `layer.transform` when canvas layer selected.

### Styles pane (layer properties)

| Field  | Control                                                           |
| ------ | ----------------------------------------------------------------- |
| Radius | Scrub numeric + per-corner popup                                  |
| Border | Scrub numeric + color picker + clear                              |
| Shadow | Color picker + popup (color first, then X/Y/blur/spread steppers) |
| Fill   | Color picker (RGBA) + clear action                                |

### Transforms pane

| Field   | Control                                        |
| ------- | ---------------------------------------------- |
| Rotate  | Scrub numeric + ° suffix + rotate/flip actions |
| Opacity | NumberInput 0–100                              |

---

## Decision ledger

| Decision | Source | Role rule | Why |
| --- | --- | --- | --- |
| Dark chrome, white artboard | shadcn/designer editor | Artboard is hero surface | Matches reference product |
| 10px control radius | shadcn/ui tokens | Inputs, buttons only | Current 6px reads too sharp/cheap |
| Inset ring elevation | shadcn/ui card shadow | Inputs, cards, toolbar | Avoid heavy drop shadows on static UI |
| Blue selection only | shadcn/designer editor | Canvas handles | Current blue focus rings feel Tailwind-generic |
| 36px header slot | Framer / Artboard Studio screens | `EditorLayout` optional `topBar` slot | Custom apps only; not used by default shell |
| 240/280px sidebars | shadcn/designer editor proportions | Primary / secondary sidebar width | Reference uses narrow chrome, wide canvas |
| Geist/Inter stack | shadcn/ui typography | All UI text | Precise, technical voice |
| Mono for numbers | shadcn/designer inspector | X/Y/W/H, zoom | Aligns numeric columns |
| CSS modules, no Tailwind | User constraint | All components | Zero runtime CSS-in-JS, no shadcn dep |
| Floating toolbar overlay | shadcn/designer editor | Canvas-only control | Keeps canvas uncluttered |
| Segment tabs not underline tabs | shadcn/ui Tabs pattern | Sidebar header | Reference uses pill segments |

---

## Implementation roadmap

### Phase 1 — Token realignment (1 PR)

- [ ] Replace `tokens.css` with v2 token set above
- [ ] Update all `*.module.css` to use rings instead of borders on controls
- [ ] Bump control radius to 10px
- [ ] Fix focus rings to white/neutral
- [ ] Slim top bar to 36px; Export → `default` button variant

### Phase 2 — Component refinement (1 PR)

- [ ] Add `InputGroup`, `FieldGrid` primitives
- [ ] Refine `LayerTreeRow` (icons, lock, selection state)
- [ ] Restyle `FloatingToolbarRenderer` (lighter float, tighter icons)
- [ ] Restyle sidebar `Tabs` as full-width segment control
- [ ] `PanelSection` hairline separators

### Phase 3 — Property panes (1 PR)

- [x] Secondary sidebar uses shared `ViewContainerViews` for tree / properties / component content (replaces standalone `PropertyPanelRenderer`)
- [x] Shared scroll chrome is `ViewPane`; **Inspector** remains only as the default secondary container for canvas layer/node property views
- [ ] Wire Layer pane to transform (X/Y/W/H)
- [ ] Add Styles pane color swatch row
- [ ] Phase 2 layout fields behind `PropertyBuilder` extensions in canvas layers

### Phase 4 — Canvas polish (1 PR)

- [ ] Artboard shadow token
- [ ] Selection size tooltip popover
- [ ] Zoom chip ↔ viewport sync (already wired; restyle only)

---

## Quality checklist

Before merging visual changes, verify against [shadcn/designer editor](https://ds.shadcn.com/examples/editor):

- [ ] Artboard is the brightest surface on screen
- [ ] No blue outside canvas selection/focus on artboard
- [ ] Inputs use inset ring, not hard border
- [ ] Floating toolbar feels elevated, not heavy
- [ ] Sidebar tabs are pill segments, not underlined
- [ ] Inspector sections match Layout / Layer / Styles / Transforms rhythm
- [ ] Layer rows are 28px, icon + label + optional trailing action
- [ ] Export button is the only solid light fill in top bar
- [ ] All spacing snaps to 4px grid

---

## File map

| Path | Purpose |
| --- | --- |
| `src/theme/tokens.css` | Global CSS variables — **single source of truth** |
| `src/context/theme-context.tsx` | `ThemeProvider`, `useTheme`, `useThemeScope` |
| `src/primitives/` | `button`, `input`, `input-group`, `segmented-control`, `tabs`, `panel-section`, `icon-button` |
| `src/layout/` | `editor-layout`, `activity-sidebar`, `canvas-chrome`, `floating-toolbar`, `zoom-controls`, `view-pane` |
| `src/renderers/` | Descriptor → UI (view tree, property panes, menus) |
| `src/shell/shell.tsx` | Orchestrator |
| `Design.md` | This document |

Import theme in apps and pick a default theme:

```tsx
import { WorkbenchShell } from '@xmazu/openenvxee-workbench';
import '@xmazu/openenvxee-workbench/theme.css';

<WorkbenchShell theme="light" plugins={plugins} />;
```

---

## References

- [shadcn/designer](https://ds.shadcn.com/) — primary product reference
- [shadcn/designer editor example](https://ds.shadcn.com/examples/editor) — layout lock
- [shadcn/ui](https://ui.shadcn.com) — token grammar (radius, rings, type)
- Refero: Framer dark editor, Artboard Studio, Glorify canvas editors — three-column pattern evidence
