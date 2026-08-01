# Sandbox showUI floating panel — design

**Date:** 2026-07-31  
**Status:** Approved

## Problem

`openenvx.showUI` rendered as a centered Radix Dialog with a full-viewport backdrop. That blocked the canvas while the plugin UI was open. Figma’s plugin UI is a floating panel you can leave open while editing.

## Decision

Replace the modal with a **non-modal, title-bar-draggable floating panel** in `@openenvx/workbench` sandbox chrome.

| Behavior | Spec |
| --- | --- |
| Backdrop | None — canvas / workbench stay interactive |
| Default dock | Bottom-right (clear of toast stack) |
| Drag | Title-bar pointer drag; clamp to viewport |
| Dismiss | Close / Stop / `closeUI` / Esc — **not** click-outside |
| Cardinality | One UI at a time (unchanged) |
| Close vs Stop | Close UI only; Stop / `closePlugin` ends the isolate |
| Position API | Host chrome only — not exposed on `showUI` options |
| `showUI` options | Still `width` / `height` only; open resets to default corner |

## Visual lock ([Design.md](../../packages/workbench/Design.md))

Same floating-chrome grammar as FloatingToolbar / popovers:

- Surface: `--wb-popover`
- Elevation: `--wb-shadow-float`
- Radius: `--wb-radius-lg`
- Existing `Button` primitives; `data-owb-theme` on the body portal host
- No `--wb-backdrop-overlay`, no accent-blue chrome, no hard-coded hex

## Package placement

| Layer                 | Role                                   |
| --------------------- | -------------------------------------- |
| workbench             | `SandboxUiPanel` + CSS, host mount     |
| controller            | Unchanged single-slot `SandboxUiState` |
| demos / canvas / core | No panel chrome                        |

## Out of scope

Multi-panel stacking, plugin-set x/y, window resize handles beyond existing `resizeUI`.
