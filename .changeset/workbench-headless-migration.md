---
"@openenvx/core": major
"@openenvx/headless": minor
"@openenvx/canvas": major
---

Move workbench UI contributions from `@openenvx/core` to `@openenvx/headless`. Canvas shell chrome removed from `@openenvx/canvas`; apps wire `CanvasHostProvider` to the workbench or use enterprise `@openenvx/canvas-pro`.

**Migration:**
- Import workbench types (`ToolbarContribution`, `EditorPaneContribution`, `InspectorPaneBuilder`, `WorkbenchLayout`, …) from `@openenvx/headless` instead of `@openenvx/core`.
- Use `WorkbenchPlugin` + `ctx.registerWorkbench()` instead of `ctx.register()` for UI contributions.
- Replace `DEFAULT_CANVAS_LAYOUT` with `DEFAULT_WORKBENCH_LAYOUT` from headless (`floatingToolbar` defaults to `false`).
- Wire canvas editor panes in your app shell via `CanvasHostProvider` (see `apps/demo-playground`).
