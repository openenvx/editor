# Workbench design

Native desktop design-tool shell. Compact, system chrome. Not marketing.

Product role lives in [Architecture.md](../../Architecture.md) and [docs/architecture/workbench-and-headless.md](../../docs/architecture/workbench-and-headless.md). This file is the visual system for `@openenvx/studio` only. Do not restyle cloud dashboard or driver artboard CSS beyond shared `--wb-*` tokens.

## Look

1:1 with Synara's default **Codex** pack (`DEFAULT_THEME_STATE` in [synara `theme.logic.ts`](https://github.com/Emanuele-web04/synara)). White / charcoal desktop chrome, 12px system UI, frosted sidebar, opaque inset stage, 5% content seam, 28px rounded rows, flat controls, no drop shadows.

Reject Inter, Geist, Cal Sans as loaded families, warm cream dark type, lit inset-highlight controls, 11px Figma density, solid blue chrome fills, Lucide, Radix.

## Tokens

Source of truth: [`src/theme/tokens.css`](src/theme/tokens.css). Values are the Synara `buildThemeCssVariables` output for Codex light/dark (macOS translucent sidebar). Scopes: `[data-owb-theme="light"]` (default) and `[data-owb-theme="dark"]`. Theme switching via `ThemeProvider` / `data-owb-theme` on the shell root.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--wb-background` | `#ffffff` | `#101010` | Window under-surface |
| `--wb-canvas-field` | `#ffffff` | `#101010` | Infinite workspace |
| `--wb-card` | `#ffffff` | `#131313` | Inset stage, inspector |
| `--wb-popover` / `--wb-menu` | opaque white / 96% | `rgb(23,23,23)` / 96% | Menus, popovers |
| `--wb-border` | `rgba(13,13,13,0.069)` | `rgba(252,252,252,0.072)` | Hairlines |
| `--wb-muted` | `rgba(13,13,13,0.04)` | `rgba(252,252,252,0.026)` | Wells, segmented tracks |
| `--wb-hover-overlay` | `rgba(13,13,13,0.03)` | `rgba(252,252,252,0.039)` | Row / icon hover |
| `--wb-sidebar-row-selected` | `rgba(13,13,13,0.03)` | `rgba(252,252,252,0.026)` | Selected sidebar row |
| `--wb-input-fill` | `rgb(255,255,255)` | `rgb(23,23,23)` | Inputs |
| `--wb-seam-line` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` | Sidebar ↔ stage inset seam |
| `--wb-surface-divider` | 60% of border | 60% of border | Internal header / pane splits |
| `--wb-sidebar-surface` | 38% white on `#e0e0e0` | `#111111` 80% toward black | Activity bar only (opaque stand-in for Synara vibrancy) |
| `--wb-surface-blur` | `blur(4px) saturate(130%)` | same | Backdrop on sidebar / menus |
| `--wb-font` | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` | same | All UI copy |
| `--wb-text-sm` | `12px` | same | Workhorse UI size |
| `--wb-layer-row-height` / `--wb-menu-item-height` / `--wb-control-height` | `28px` (`1.75rem`) | same | Lists, menus, controls |
| `--wb-topbar-height` | `46px` | same | Title / top bar |
| `--wb-radius-lg` | `0.625rem` | same | Controls, panels |
| `--wb-radius-md` | `8px` | same | Sidebar rows |
| `--wb-foreground` | `#0d0d0d` | `#fcfcfc` | Primary text |
| `--wb-muted-foreground` | `rgba(13,13,13,0.598)` | `rgba(252,252,252,0.58)` | Labels, metadata |
| `--wb-primary` | `#0d0d0d` | `#fcfcfc` | Primary button fill |
| `--wb-focus` | `#0169cc` | `rgba(51,134,214,0.63)` | Keyboard focus ring |
| `--wb-destructive` | `#e02e2a` | `#e02e2a` | Destructive |

Canvas-facing tokens (`--wb-selection`, `--wb-artboard`, etc.) stay Konva-safe hex / classic `rgba`. Blue selection handles are **artboard only**, not chrome CTAs.

## Type

One size for UI copy: `var(--wb-text-sm, 12px)`. Weight `400` for body and nav, `500` for section titles and selected labels. `letter-spacing: normal` so system UI reads native on macOS.

Monospace for code paths: `var(--wb-font-mono)`.

## Chrome

Three columns: activity + layers rail | canvas stage | inspector.

- Activity bar: `--wb-sidebar-surface` (gray / charcoal), selected icon = `--wb-sidebar-segment-active`
- Layers + inspector: `--wb-card`, 1px `--wb-surface-divider` against the artboard, 28px `rounded-md` rows
- Inspector / headers: `--wb-surface-divider` (not the outer seam)
- Top bar: 46px, flat `chrome` / `ghost` controls, 12px
- Menus: 96% fill, hairline border, no drop shadow
- Floating canvas toolbar: compact pill on the artboard (not a full-width chrome row)

Contribution-driven layout only — hosts declare views and toolbars; the shell renders.

## Components

Kit lives in [`src/primitives`](src/primitives) on **Base UI** headless primitives + **CSS modules**. Icons: **`@tabler/icons-react`** only (`WorkbenchIcon` + glyph map).

| Role            | Treatment                                            |
| --------------- | ---------------------------------------------------- |
| Primary         | `Button` default, ~28px height, flat fill, no shadow |
| Secondary       | `outline`                                            |
| Destructive     | outline / muted red, not a loud fill                 |
| Quiet / toolbar | `ghost` / `chrome`                                   |
| Card / panel    | hairline + `--wb-card` only                          |
| Input           | `--wb-input-fill`, 12px                              |

Command palette uses `cmdk`, styled to the same flat language.

## Layout files

| File | Role |
| --- | --- |
| [`src/shell/workbench-shell.tsx`](src/shell/workbench-shell.tsx) | Shell root, theme scope |
| [`src/layout/editor-layout.tsx`](src/layout/editor-layout.tsx) | Three-column grid |
| [`src/layout/activity-sidebar.tsx`](src/layout/activity-sidebar.tsx) | Activity + primary sidebar |
| [`src/renderers/secondary-sidebar-renderer.tsx`](src/renderers/secondary-sidebar-renderer.tsx) | Inspector rail |
| [`src/renderers/top-bar-renderer.tsx`](src/renderers/top-bar-renderer.tsx) | Top bar |
| [`src/context/theme-context.tsx`](src/context/theme-context.tsx) | Theme provider |

## Do not

- Add Tailwind or shadcn to studio
- Load Inter / Geist / Cal Sans via `@fontsource`
- Restyle OpenEnvx Cloud dashboard to match this file
- Use Lucide or Radix in new chrome code
- Put `oklch` or modern `rgb(… / α)` on Konva-read variables
- Remove user-facing editor chrome to fix spacing bugs
