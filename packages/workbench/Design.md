# OpenWorkbench — Design Specification

Designing the `@openenvx/workbench` React UI for canvas/flow editor authors on **web**.

**Goal:** A composable, performant editor shell that reads as a **native desktop design tool**, not a web app in a browser tab.

**Tone:** Tool-native, dense, physical. Achromatic chrome; colour only where it carries meaning.

**Primary reference:** [Figma](https://figma.com) — density, menu grammar, canvas-only accent  
**Material reference:** [Paper](https://paper.design) — translucent chrome, lit controls, oklch ramps  
**Secondary reference:** Framer / Artboard Studio editor screens (Refero) — three-column canvas layout patterns

**Status (v4):** Token system rebuilt on the Figma/Paper palette. Every workbench CSS module is token-driven, so the palette, density, radius, and material are changed from [`tokens.css`](src/theme/tokens.css) alone — `canvas`, `html`, `driver-email`, and `agent` inherit it.

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
Primary direction: a native design tool window (Figma density + Paper material)

Preserve:
  - Three-column editor anatomy (layers | canvas | inspector)
  - Achromatic UI chrome; colour only for canvas selection + semantic states
  - White artboard as the visual hero; chrome recedes
  - Floating bottom toolbar pill on canvas (not full-width chrome row)

App-native grammar (what stops it reading like a website):
  - 11px workhorse UI type — 12px only for section headers
  - Tight radii: 5px controls, 6px panels/menus, 10px floating surfaces
  - Menus are translucent + backdrop-blurred, not opaque cards
  - Menu rows are 24px with a solid blue full-row highlight and white text
  - Light controls are LIT: hairline border + inset white top highlight + 1px drop
  - Custom thin scrollbars; `color-scheme` set so native widgets follow the theme

Role rules:
  - Blue (#3b82f6): canvas selection handles, dimension badge, transform state ONLY
  - Menu highlight blue (--wb-menu-highlight): highlighted menu/command rows ONLY
  - Focus ring (--wb-focus): 1px accent stroke + 3px soft halo on inputs
  - Muted foreground: labels, captions, inactive icons, chevrons
  - Never use accent blue for panel backgrounds, tab fills, or button defaults

Reject:
  - Flat grey panels with no elevation hierarchy
  - Opaque menu cards with drop shadows but no outline
  - 12–13px type everywhere (reads like a web form, not a tool)
  - Decorative gradients, purple accents, warm cream palettes
```

---

## Token system (v4 — current)

All tokens live in [`src/theme/tokens.css`](src/theme/tokens.css). The file defines two built-in scopes — `[data-owb-theme="light"]` (default) and `[data-owb-theme="dark"]` — plus a shared `[data-owb-theme]` layer for theme-agnostic type, spacing, radius, metrics, and material.

Every workbench CSS module should resolve colour, radius, and metrics from these variables when a token exists. Prefer tokens over literals; a few layout sizes (activity icon pill, tooltip min-height, label stack gap) stay as module literals when they are one-offs. Downstream packages (`canvas`, `html`, `driver-email`, `agent`) read the same variables for shared chrome and canvas-facing colours.

### Surfaces

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--wb-background` | `#f0f0f0` | `#2a2a2a` | Panel chrome: activity bar, sidebars, inspector |
| `--wb-canvas-field` | `#d9d9d9` | `#1e1e1e` | Infinite canvas workspace — always darker than chrome |
| `--wb-card` | `#ffffff` | `#222222` | Elevated inset surfaces (active tab, cards) |
| `--wb-popover` | `#ffffff` | `#2a2a2a` | Opaque floating surfaces with interactive content |
| `--wb-property-popover` | `#ffffff` | `#222222` | Property popup shell |
| `--wb-menu` | `rgb(247 247 247 / 92%)` | `rgb(42 42 42 / 92%)` | Menus — translucent, paired with `--wb-surface-blur` |
| `--wb-popup-header` | `#dddddd` | `#222222` | Popup title bars |
| `--wb-muted` | `#fbfbfb` | `#373737` | Control fill: inputs, segment track, chips |
| `--wb-border` | `#dcdcdc` | `#373737` | Structural dividers |
| `--wb-artboard` | `#ffffff` | `#ffffff` | Artboard fill — the hero surface |

Light chrome is grey and controls sit **lighter** than the panel; dark chrome is graphite and controls sit **lighter** than the panel too. In both directions the canvas field is the darkest region so the artboard reads as the subject.

### Text and accent

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--wb-foreground` | `rgba(0, 0, 0, 0.9)` | `rgba(255, 255, 255, 0.9)` | Primary text (Konva-safe classic rgba) |
| `--wb-muted-foreground` | `rgba(0, 0, 0, 0.62)` | `rgba(255, 255, 255, 0.62)` | Labels, captions, inactive icons |
| `--wb-focus` | `oklch(74% 0.12 258)` | `oklch(60% 0.15 258)` | Focus stroke |
| `--wb-menu-highlight` | `oklch(67% 0.17 258)` | `oklch(55% 0.145 258)` | Highlighted menu / command row |
| `--wb-menu-highlight-foreground` | `#ffffff` | `#ffffff` | Text on a highlighted row |
| `--wb-primary` | `#1e1e1e` | `#f2f2f2` | High-contrast CTA fill |
| `--wb-destructive` | `#d5232c` | `#f56a63` | Delete, error |
| `--wb-tooltip` | `rgb(30 30 30 / 94%)` | `rgb(74 74 74 / 94%)` | Tooltip pill — inverse in light, lifted in dark |
| `--wb-tooltip-shadow` | drop shadow | drop shadow | Tooltip elevation |

**Canvas-facing tokens stay Konva-safe hex / classic `rgba(r, g, b, a)`.** `--wb-selection`, `--wb-selection-muted`, `--wb-smart-guide`, `--wb-page-margin`, `--wb-grid`, `--wb-foreground`, and the `--wb-artboard*` set are read with `getComputedStyle` and handed to Konva by [`useCanvasThemeColors`](../canvas/src/use-canvas-theme-colors.ts). Do not express those in modern `rgb(… / α)`, `oklch`, or `oklab` — Konva's colour parser returns NaN.

### Type scale

11px is the workhorse size — the single biggest signal that this is a tool and not a web form.

| Token            | Value  | Use                                       |
| ---------------- | ------ | ----------------------------------------- |
| `--wb-text-xs`   | `10px` | Captions, unit suffixes, shortcuts        |
| `--wb-text-sm`   | `11px` | Body, menu rows, tree items, field labels |
| `--wb-text-base` | `12px` | Section headers                           |
| `--wb-text-mono` | `11px` | X / Y / W / H, zoom                       |

**Font stack:** `Inter, -apple-system, BlinkMacSystemFont, system-ui, sans-serif`  
**Mono stack:** `ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace`

### Radius

| Token                 | Value    | Use                                       |
| --------------------- | -------- | ----------------------------------------- |
| `--wb-radius-sm`      | `3px`    | Menu rows, chips, thumbnails              |
| `--wb-radius-control` | `5px`    | Inputs, buttons, segments                 |
| `--wb-radius-md`      | `6px`    | Panels, sections, menu shells             |
| `--wb-radius-lg`      | `10px`   | Floating toolbar, popovers, sandbox panel |
| `--wb-radius-full`    | `9999px` | Pills, scrollbar thumbs                   |

### Metrics

| Token                          | Value   | Use                               |
| ------------------------------ | ------- | --------------------------------- |
| `--wb-control-height`          | `24px`  | Inputs, buttons, selects          |
| `--wb-control-padding-x`       | `6px`   | Leading/trailing inset in a field |
| `--wb-icon-button-size`        | `24px`  | Icon buttons                      |
| `--wb-icon-button-size-lg`     | `28px`  | Floating toolbar icons            |
| `--wb-menu-item-height`        | `24px`  | Menu and submenu rows             |
| `--wb-layer-row-height`        | `24px`  | Layer tree rows                   |
| `--wb-activity-bar-width`      | `56px`  | Left icon rail with labels        |
| `--wb-sidebar-width`           | `240px` | Side panel beside activity bar    |
| `--wb-secondary-sidebar-width` | `280px` | Secondary side bar (right)        |

### Material

| Token | Value | Use |
| --- | --- | --- |
| `--wb-surface-blur` | `saturate(180%) blur(20px)` | `backdrop-filter` on menus and tooltips |

Menus set `background: var(--wb-menu)` **and** `backdrop-filter: var(--wb-surface-blur)`. Popovers that host interactive content (colour picker, property popups) stay opaque on `--wb-popover` for legibility.

### Motion

Entrance and overlay `@keyframes` live **inside** the CSS module that uses them (same pattern as `overlay-surface.module.css` / `sheet.module.css`) so Vite scopes `animation-name` and `@keyframes` together. Durations use `--wb-duration` / `--wb-duration-fast`. Do not put shared keyframes in `tokens.css` and reference them from modules — hashed names miss, and `:global(…)` in an `animation` value breaks our PostCSS pipeline.

### Theme-aware alpha tokens

These flip between white and black overlays so hover states and dividers stay subtle in both directions.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--wb-hover-overlay` | `rgb(0 0 0 / 6%)` | `rgb(255 255 255 / 6%)` | Hover on transparent controls |
| `--wb-active-overlay` | `rgb(0 0 0 / 9%)` | `rgb(255 255 255 / 9%)` | Pressed / active backgrounds |
| `--wb-divider-color` | `rgb(0 0 0 / 8%)` | `rgb(255 255 255 / 9%)` | Structural dividers |
| `--wb-border-subtle` | `rgb(0 0 0 / 10%)` | `rgb(255 255 255 / 10%)` | Subtle borders on elevated surfaces |
| `--wb-backdrop-overlay` | `rgb(0 0 0 / 35%)` | `rgb(17 17 17 / 72%)` | Modal / overlay backdrops |

### Control shadows (inputs, selects, switches)

Form controls use `--wb-shadow-control` at rest and `--wb-shadow-control-focus` on focus — not `--wb-shadow-xs` / `--wb-shadow-focus` directly.

Light controls are **lit, not flat**: a hairline border, an inset white highlight along the top edge, and a 1px drop. This is what makes a light control read as a physical surface instead of a filled `<div>`.

| Token | Light | Dark |
| --- | --- | --- |
| `--wb-shadow-control` | hairline + inset white top highlight + 1px drop | hairline ring + faint inset highlight |
| `--wb-shadow-control-hover` | stronger hairline, same lighting | stronger hairline ring |
| `--wb-shadow-control-focus` | 2px inset `--wb-focus` + hairline | 2px inset `--wb-focus` + hairline |
| `--wb-shadow-float` | hairline + layered soft drops | solid `#444` outline + layered drops |

Field focus rings are drawn **inside** the control (inset), so a focused field never grows into its neighbours in a dense inspector. Buttons, tabs, and icon buttons keep the outer halo via `--wb-shadow-focus`.

Where the engine supports `corner-shape`, controls switch to `superellipse(1.3)` and the radius scale steps up — a squircle reads tighter than the same circular radius. It is scoped to controls: `corner-shape` does not inherit, and applying it broadly would flatten intentional circles built on `--wb-radius-full`.

Floating surfaces always carry a **1px outline** in addition to the drop shadow — a shadow alone reads as a web card.

### Chrome details

`tokens.css` also sets, on every `[data-owb-theme]` scope:

- `color-scheme: light | dark` — native form widgets, caret, and default scrollbars follow the theme
- `-webkit-font-smoothing: antialiased` — matches native app text rendering
- Thin custom scrollbars (`--wb-scrollbar-thumb`, `--wb-scrollbar-thumb-hover`) via `scrollbar-color` and `::-webkit-scrollbar`
- `::selection` tinted with `--wb-selection-muted`

---

## Runtime theming

`WorkbenchShell` accepts a `theme` prop. Built-in values are `'light'` and `'dark'`. The default is `'light'`. Any other string is treated as a custom theme name and exposed via `data-owb-theme` on the shell DOM and on Radix portal content (dropdowns, popovers, selects, tooltips).

Users can switch between built-in themes from **File → Theme** in the activity sidebar. The shell keeps theme state internally and calls `onThemeChange` when the selection changes.

```tsx
import { WorkbenchShell } from '@openenvx/workbench';
import '@openenvx/workbench/theme.css';

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

OpenWorkbench should feel like a **native design tool that happens to run in a browser** — not a web app wearing an editor costume.

The product is the **artboard**. Everything else is scaffolding: thin, dense, and visually quiet. What separates the two is mostly material, not layout: an app has lit controls, translucent menus, hairline outlines, 11px type, and native-feeling scrollbars; a website has flat fills, opaque cards, 14px type, and browser scrollbars.

We copy the grammar of Figma and Paper **through tokens and CSS modules** — no Tailwind, no shadcn dependency. The components are ours.

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
| ActivityBar | `ActivitySidebar` (icon rail) | 56px; icon + label per item; active icon sits in a 38×34 rounded pill tinted with `--wb-selection` at 14%, icon in `--wb-selection` (Figma-style) |
| Primary Side Bar | `ActivitySidebar` (panel body) | 240px; title header + scrollable `ViewPane` content |
| CanvasField | `EditorChrome` | `--wb-canvas-field` bg; artboard centered |
| FloatingToolbar | `FloatingToolbarRenderer` | Bottom-center overlay; contribution-driven tools + widgets |
| Secondary Side Bar | `ViewContainerViews` + `ViewPane` | 280px; default **Inspector** container (`workbench.inspector`) hosts canvas layer/node property views; same view chrome as primary |
| StatusBar | `StatusBarRenderer` | 24px; zoom, dirty/saved, selection summary |

---

## Component specifications

### Button

| Variant | Background | Border/Ring | Text |
| --- | --- | --- | --- |
| `default` | `--wb-primary` | none | `--wb-primary-foreground` |
| `ghost` | transparent | none | `--wb-muted-foreground` → `--wb-foreground` on hover |
| `outline` | transparent | `--wb-shadow-xs` | `--wb-foreground` |
| `icon` | transparent | none | muted → foreground |

Height `--wb-control-height`, radius `--wb-radius-control`. No coloured fills except `default`.

### Menus (DropdownMenu, ContextMenu, Select, Command)

The single loudest "is this an app?" signal. All four share `dropdown-menu.module.css` for the shell and row.

- Shell: `--wb-menu` fill **plus** `backdrop-filter: var(--wb-surface-blur)`, `--wb-radius-md`, `--wb-space-1` padding, `--wb-shadow-float` (outline + drop)
- Row: `--wb-menu-item-height`, `--wb-radius-sm`, `--wb-text-sm`, `--wb-space-2` horizontal padding, 16px line-height (clears clipped descenders)
- Highlight: solid `--wb-menu-highlight` bar with `--wb-menu-highlight-foreground` text — **not** a grey hover fill. Command palette rows use the same `command.module.css` selected style (do not re-override in the palette renderer).
- Everything inside a highlighted row inherits that text colour; shortcuts and chevrons drop to `opacity: 0.75`
- Radio/check rows put the indicator in a **leading 12px gutter** so labels stay aligned whether or not they are checked
- Separators are inset to the row content (margin `--wb-space-1` vertical) — they do **not** bleed full width
- Shortcut labels go through `formatShortcut`: Apple glyphs on Apple hosts, `Ctrl+…` elsewhere

### Tooltip

- Inverse pill: `--wb-tooltip` fill, `--wb-tooltip-foreground` text, `--wb-tooltip-border` hairline
- `--wb-radius-sm`, 22px min height, `--wb-text-sm` — small and tight, never a card

### Input / NumericInput

- Height: `--wb-control-height`
- Background: `--wb-muted`
- Rest: `--wb-shadow-control` — lit in light (hairline + inset top highlight + drop), hairline ring in dark
- Radius: `--wb-radius-control`
- Padding: 0 `--wb-control-padding-x`
- Focus: `--wb-shadow-control-focus` (2px inset `--wb-focus`, both themes). NumericInput also shows it while scrubbing via `[data-scrubbing]`.
- Digits use `font-variant-numeric: tabular-nums` so values do not reflow while dragged
- NumericInput: right-aligned mono, optional scrub handle; used in X/Y/W/H pairs

### StepperField

Compound numeric control used inside property popovers:

```
Top     [↓ 0        ] [+] [-]
```

- Row: fixed left label column + flexible input + two 28px step buttons
- Input: muted field surface, mono value, optional directional/corner icon inside the field
- Step buttons: same muted surface as the input, same control height, same focus ring
- Used for: `Padding`, `Radius`, `Shadow` popup rows

### InputGroup

Paired numeric fields (X/Y, W/H) — separate fields side by side (Figma-style):

```
┌─────────┐ ┌─────────┐
│ X  540  │ │ Y  960  │
└─────────┘ └─────────┘
```

- Two equal-width cells with an 8px gap, each with its own muted fill + control ring
- Each cell: label prefix inside the field (muted, 11px, doubles as scrub handle) + mono value, left-aligned
- Inspector rows default to a small muted label stacked **above** the control (`PropertyFieldRow` default variant); `switch` and `inline` variants stay horizontal

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

- Header: `--wb-text-base` weight **600**, chevron **14px** (rotates via CSS when collapsed), padding `--wb-space-2` / `--wb-space-4` (8×16)
- No background change on hover — only chevron colour / rotate
- Body: padding 0 `--wb-space-4` `--wb-space-4`; expand uses module-local `slideInUp` keyframes
- Sections separated by `--wb-hairline` (not `--wb-border`)

### LayerTreeRow

```
[▾] [icon] Label                    [🔒]
```

- Height: `--wb-layer-row-height`
- **Full-bleed**: square corners, edge to edge. The section body drops its horizontal inset via `PanelSection bodyClassName` so rows span the whole sidebar.
- Padding-left: `8 + depth * 6` px (`TREE_BASE_PADDING_PX` / `TREE_INDENT_PX` in `tree-dnd-utils.ts`)
- Selected: `--wb-sidebar-row-selected` — a neutral tonal step, not an accent tint; a full-width blue bar in a dense tree reads as an alert
- Hover: `--wb-sidebar-row-hovered` — the same hue, less opaque
- Icons: 14px lucide, `--wb-muted-foreground`
- Label: `--wb-text-sm`, truncate

### FloatingToolbarRenderer

- Background: `--wb-popover`
- Ring: `--wb-shadow-float`
- Radius: `--wb-radius-lg`
- Padding: 4px
- Icon buttons: `--wb-icon-button-size-lg`, ghost variant
- Dividers: 1px × 20px, `--wb-divider-color`
- Zoom chip: mono `--wb-text-xs`, ghost, min-width 44px

### SandboxUiPanel

Non-modal floating host chrome for sandbox `showUI` (Figma-shaped plugin window):

- Background: `--wb-popover`
- Ring: `--wb-shadow-float`
- Radius: `--wb-radius-lg` (same shell as floating toolbar)
- Default dock: CSS bottom-right (toast clearance); title-bar drag switches to clamped `left`/`top`
- Stack: `z-index` 40 (above canvas chrome 10; below overlays / palette / confirm 100); toasts 45
- No backdrop — canvas stays interactive; click-outside does not dismiss
- Close / Stop / Esc (when panel chrome focused) / `closeUI` dismiss; Close ≠ Stop isolate
- Title: `--wb-text-sm` / `--wb-muted-foreground`; actions use existing `Button` (`sm` outline + ghost)
- Theme: `data-owb-theme` on the body portal host (outside shell DOM)

### PropertyPopover

Popup shell for per-side/per-corner/per-shadow controls. Popovers anchor on the property panel edge facing the editor (right-docked Inspector: open left; left-docked primary sidebar: open right).

- Width: 256px, clamped to viewport
- Radius: `--wb-radius-md`
- Surface: `--wb-property-popover` — lifted off the panel behind it, never the same fill as `--wb-background`
- Elevation: `--wb-shadow-float` only (outline + drops); no extra `border`, which double-rings the shell
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

Property form controls are **descriptor → registered renderer**, not ad-hoc JSX in plugins. **API reference** (kinds, `layout`, `PropertyFieldDescriptor`, paths): [docs/architecture/property-fields.md](../../docs/architecture/property-fields.md). This file covers **visual** treatment only (density, radii, slot-list row surfaces).

- Slot list / repeater / variables rows: `PropertyList` + `PropertyListRow` + `PropertyListAdd` — muted surface + inset ring (`--wb-muted` / `--wb-shadow-control`), header + ghost `IconButton` (trash / menu) and ghost `sm` add control.

### Layout pane

| Field | Control | Notes |
| --- | --- | --- |
| Display | SegmentedControl `Auto \| Flex` | Phase 2 — needs layer descriptors |
| Direction | Icon toggle pair (→ ↓) | Phase 2 |
| Align / Justify | Icon button groups | Phase 2 |
| Wrap | SegmentedControl `Yes \| No` | Phase 2 |
| Gap | NumericInput |  |
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
| Opacity | NumericInput 0–100                             |

---

## Decision ledger

| Decision | Source | Role rule | Why |
| --- | --- | --- | --- |
| Grey chrome, darker canvas, white artboard | Figma / Paper | Artboard is hero surface | Canvas must be the darkest region or the artboard stops reading as the subject |
| 11px workhorse type | Figma | All body/menu/tree text | 12–13px reads as a web form; density is what makes it feel like a tool |
| 5px control radius | Paper radius ramp | Inputs, buttons, segments | 10px reads consumer-web; tools are tight |
| Lit light controls | Paper `--shadow-control` | Inputs, selects, chips | A flat fill reads as a `<div>`; a border + inset top highlight reads as a surface |
| Translucent blurred menus | Figma / macOS | Menus and tooltips only | Opaque cards are the strongest "website" tell |
| Blue full-row menu highlight | Figma / macOS | Menu + command rows | Grey hover fills read as web list items |
| Blue selection canvas-only | Figma | Canvas handles | Keeps accent meaningful; focus uses `--wb-focus` |
| Solid outline on every float | Paper `--color-popup-outline` | Menus, popovers, toolbar | Shadow-only floats look like web cards |
| `color-scheme` + custom scrollbars | Native apps | Whole shell | Browser-default scrollbars break the illusion instantly |
| System/Inter stack | Figma / Paper | All UI text | Matches host OS text rendering |
| Mono for numbers | Figma inspector | X/Y/W/H, zoom | Aligns numeric columns |
| CSS modules, no Tailwind | User constraint | All components | Zero runtime CSS-in-JS, no shadcn dep |
| Floating toolbar overlay | Figma | Canvas-only control | Keeps canvas uncluttered |
| Segment tabs not underline tabs | Figma sidebar | Sidebar header | Underlines read as web navigation |

---

## Implementation roadmap

### Phase 1 — Token realignment

- [x] Rebuild `tokens.css` on the Figma/Paper palette (v4)
- [x] 11px type scale; tight radius ramp; 24px controls, 24px menu rows
- [x] Lit control shadows in light; hairline-outlined floats in both themes
- [x] Translucent blurred menus + blue full-row highlight
- [x] `color-scheme`, custom scrollbars, `::selection`, font smoothing

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

Before merging visual changes, check both themes:

- [ ] Artboard is the brightest surface; the canvas field is the darkest region
- [ ] No blue outside canvas selection, focus rings, and menu highlights
- [ ] Menus are translucent and blurred, with a solid blue highlighted row
- [ ] Light controls read as lit surfaces, not flat fills
- [ ] Every floating surface has a 1px outline, not just a drop shadow
- [ ] Body text is 11px; only section headers are 12px
- [ ] Scrollbars are the thin custom ones, not the browser default
- [ ] Prefer tokens over new colour/size literals in `*.module.css`
- [ ] Canvas-facing tokens stay Konva-safe hex / classic `rgba` (never modern `rgb(… / α)`, `oklch`, `oklab`)
- [ ] Prefer the spacing scale; document intentional off-grid one-offs (activity pill, tooltip)

---

## File map

| Path | Purpose |
| --- | --- |
| `src/theme/tokens.css` | Global CSS variables — **single source of truth** |
| `src/context/theme-context.tsx` | `ThemeProvider`, `useTheme`, `useThemeScope` |
| `src/primitives/` | `button`, `input`, `input-group`, `property-list`, `segmented-control`, `tabs`, `panel-section`, `icon-button` |
| `src/layout/` | `editor-layout`, `activity-sidebar`, `canvas-chrome`, `floating-toolbar`, `zoom-controls`, `view-pane` |
| `src/renderers/` | Descriptor → UI (view tree, property panes, menus) |
| `src/shell/shell.tsx` | Orchestrator |
| `Design.md` | This document |

Import theme in apps and pick a default theme:

```tsx
import { WorkbenchShell } from '@openenvx/workbench';
import '@openenvx/workbench/theme.css';

<WorkbenchShell theme="light" plugins={plugins} />;
```

---

## References

- [Figma](https://figma.com) — density, menu grammar, canvas-only accent
- [Paper](https://paper.design) — material reference: translucent chrome, lit controls, oklch ramps, radius scale
- Refero: Framer dark editor, Artboard Studio, Glorify canvas editors — three-column pattern evidence
