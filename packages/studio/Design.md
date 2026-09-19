# Workbench design

Native desktop design-tool shell. Compact, system chrome. Not marketing.

Product role lives in [Architecture.md](../../Architecture.md) and [docs/architecture/workbench-and-headless.md](../../docs/architecture/workbench-and-headless.md). This file is the visual system for `@openenvx/studio` only. Do not restyle cloud dashboard or driver artboard CSS beyond shared `--wb-*` tokens.

## Look

Light and dark. Near-white / near-black canvas, 4% ink hairlines, system UI at 12px with normal tracking, frosted sidebar rail, opaque inset editor stage, flat controls. No drop shadows on chrome. Rows 1.75rem. Top bar 46px.

Reject Inter, Geist, Cal Sans as loaded families, warm cream dark type, lit inset-highlight controls, 11px Figma density, solid blue menu-row fills, Lucide, Radix.

## Tokens

Source of truth: [`src/theme/tokens.css`](src/theme/tokens.css). Scopes: `[data-owb-theme="light"]` (default) and `[data-owb-theme="dark"]`. Theme switching via `ThemeProvider` / `data-owb-theme` on the shell root.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `--wb-background` | `#fcfcfc` | `#0e0e0e` | Panel chrome, activity bar |
| `--wb-canvas-field` | `#ececec` | `#0a0a0a` | Infinite workspace (darker than chrome) |
| `--wb-card` | `#ffffff` | `#0f0f0f` | Inset stage, inspector, elevated surfaces |
| `--wb-popover` / `--wb-menu` | white / 92% | `#0f0f0f` / 92% | Menus, popovers (translucent + blur) |
| `--wb-border` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.04)` | Hairlines |
| `--wb-muted` | `rgba(0,0,0,0.04)` | `rgba(255,255,255,0.04)` | Hover, selected rows, fills |
| `--wb-input-fill` | `rgba(0,0,0,0.06)` | `rgba(255,255,255,0.05)` | Inputs, dense fields |
| `--wb-seam-line` | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` | Inset content seam |
| `--wb-sidebar-surface` | card glass | charcoal glass ~72% | Frosted rail |
| `--wb-surface-blur` | `blur(4px) saturate(130%)` | same | Backdrop on sidebar / menus |
| `--wb-font` | `-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif` | same | All UI copy |
| `--wb-text-sm` | `12px` | same | Workhorse UI size |
| `--wb-layer-row-height` / `--wb-menu-item-height` / `--wb-control-height` | `28px` (`1.75rem`) | same | Lists, menus, controls |
| `--wb-topbar-height` | `46px` | same | Title / top bar |
| `--wb-radius-lg` | `0.625rem` | same | Controls, panels |
| `--wb-foreground` | `rgba(0,0,0,0.88)` | `#f5f5f5` | Primary text (Konva-safe) |
| `--wb-muted-foreground` | `rgba(0,0,0,0.55)` | `rgba(255,255,255,0.55)` | Labels, metadata |
| `--wb-primary` | `#171717` | `#f5f5f5` | Primary button fill |
| `--wb-focus` | `rgba(0,0,0,0.4)` | `rgba(255,255,255,0.4)` | Keyboard focus ring (neutral, no blue glow) |

Canvas-facing tokens (`--wb-selection`, `--wb-artboard`, etc.) stay Konva-safe hex / classic `rgba`. Blue selection handles are **artboard only**, not chrome CTAs.

## Type

One size for UI copy: `var(--wb-text-sm, 12px)`. Weight `400` for body and nav, `500` for section titles and selected labels. `letter-spacing: normal` so system UI reads native on macOS.

Monospace for code paths: `var(--wb-font-mono)`.

## Chrome

Three columns: activity + layers rail | canvas stage | inspector.

- Sidebars: `--wb-sidebar-surface` + `--wb-surface-blur`, 28px rows, 4% hover, selected = `--wb-muted`
- Editor / inspector inset: `--wb-card` with `inset 0.5px 0 0 var(--wb-seam-line)`
- Top bar: 46px, flat `chrome` / `ghost` controls, 12px
- Menus: translucent fill, hairline border, no drop shadow
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
