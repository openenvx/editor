# Workbench design

The editor shell uses the Synara / Neroli design system (coss ui, Base UI, Codex pack). Compact system chrome. Not marketing.

Product role lives in [Architecture.md](../../Architecture.md) and [docs/architecture/workbench-and-headless.md](../../docs/architecture/workbench-and-headless.md). This file is the visual system for `@openenvx/studio` only.

## Source hierarchy

1. Synara (`apps/web` primitives and `index.css` tokens).
2. Neroli dashboard, when Synara has no equivalent.
3. [coss.com/origin](https://coss.com/origin) for composed controls (number fields, tabs).
4. Ask before inventing a control that none of those have.

## Look

Codex light/dark, resolved from Synara's theme pack: white / `#101010` shell, 13px system UI, frosted menus (`blur(40px) saturate(150%)`, 16px radius), flat controls. Switch-on and focus use the Codex accent (`#0169cc` light, blue at 63% dark).

## Tokens

Source of truth: [`src/theme/tokens.css`](src/theme/tokens.css). Names match Synara (`--background`, `--foreground`, `--primary`, `--color-text-foreground`, `--color-border-focus`, `--app-font-size-ui`, …) and are scoped to `[data-owb-theme="light"|"dark"]` so a host page is not restyled. Theme switching is `ThemeProvider` / `data-owb-theme` on the shell root.

Tailwind utilities are allowed only inside CSS modules, via `@reference` of [`src/theme/tailwind.css`](src/theme/tailwind.css) and `@apply`. Published CSS is compiled to plain rules; consumers do not install Tailwind. There is no preflight on the host page. A scoped reset lives in `tokens.css` under `:where([data-owb-theme])`.

Editor-only layout vars keep Synara-style names: `--app-topbar-height`, `--app-status-bar-height`, `--inspector-width`, `--app-rail-width`. Canvas colors read by Konva use `--canvas-*` (hex / classic `rgba` only).

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--background` | `#ffffff` | `#101010` | Window under-surface |
| `--card` | `#ffffff` | `#131313` | Inset panels |
| `--popover` | `rgb(255,255,255)` | `rgb(23,23,23)` | Popovers |
| `--app-overlay-surface` | 55% of popover | 55% of popover | Frosted menus |
| `--border` | `rgba(13,13,13,0.069)` | `rgba(252,252,252,0.072)` | Hairlines |
| `--foreground` | `#0d0d0d` | `#fcfcfc` | Primary text |
| `--muted-foreground` | `rgba(13,13,13,0.598)` | `rgba(252,252,252,0.58)` | Labels |
| `--primary` | `#0d0d0d` | `#fcfcfc` | Primary button |
| `--color-border-focus` | `#0169cc` | `rgba(51,134,214,0.63)` | Focus |
| `--radius` | `0.625rem` | same | Control radius |
| `--app-font-size-ui` | `13px` | same | UI copy |
| `--app-density-row-height` | `1.75rem` | same | Rows and controls |

## Components

Kit: [`src/ui/primitives`](src/ui/primitives). Headless behavior is Base UI. Visuals are Synara / coss class strings applied in CSS modules. Icons: `@tabler/icons-react` (`WorkbenchIcon`).

| Primitive | Source |
| --- | --- |
| Button, input, checkbox, switch, select, menu, popover, tooltip | Synara `components/ui` |
| Segmented control | Synara `SegmentedPicker` |
| Tabs | coss ui tabs |
| Numeric input | Synara input chrome; editor scrub behavior |
| Color picker | Synara `.theme-color-picker` |
| Property rows | Neroli inspector density and surfaces |

## Do not

- Put Tailwind classes in TSX
- Load Inter / Geist / Cal Sans
- Use Lucide or Radix in new chrome
- Put `oklch` or modern `rgb(… / α)` on `--canvas-*` variables
- Remove user-facing editor chrome to fix spacing bugs
