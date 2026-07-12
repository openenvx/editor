# @openenvx/headless

## 0.2.0

### Minor Changes

- f71b6f8: Move workbench UI contributions from `@openenvx/core` to `@openenvx/headless`. Canvas shell chrome removed from `@openenvx/canvas`; apps wire `CanvasHostProvider` to the workbench or use enterprise `@openenvx/canvas-pro`.

  **Migration:**

  - Import workbench types (`ToolbarContribution`, `EditorPaneContribution`, `InspectorPaneBuilder`, `WorkbenchLayout`, …) from `@openenvx/headless` instead of `@openenvx/core`.
  - Use `WorkbenchPlugin` + `ctx.registerWorkbench()` instead of `ctx.register()` for UI contributions.
  - Replace `DEFAULT_CANVAS_LAYOUT` with `DEFAULT_WORKBENCH_LAYOUT` from headless (`floatingToolbar` defaults to `false`).
  - Wire canvas editor panes in your app shell via `CanvasHostProvider` (see `apps/demo-playground`).

### Patch Changes

- Updated dependencies [f71b6f8]
  - @openenvx/core@1.0.0

## 0.1.6

### Patch Changes

- 1e1bdf4: fix - bring back react
- Updated dependencies [1e1bdf4]
  - @openenvx/preview@0.1.6
  - @openenvx/schema@0.1.6
  - @openenvx/core@0.1.6

## 0.1.3

### Patch Changes

- 60cfd11: fix: versioning
- Updated dependencies [60cfd11]
  - @openenvx/core@0.1.3
  - @openenvx/preview@0.1.3
  - @openenvx/schema@0.1.3

## 0.1.2

### Patch Changes

- 1479c36: fix: fix versioning
- Updated dependencies [1479c36]
  - @openenvx/core@0.1.2
  - @openenvx/preview@0.1.2
  - @openenvx/schema@0.1.2

## 0.1.1

### Patch Changes

- 05c5915: fix: correct versioning in the npm
- Updated dependencies [05c5915]
  - @openenvx/core@0.1.1
  - @openenvx/preview@0.1.1
  - @openenvx/schema@0.1.1

## 0.1.0

### Minor Changes

- 62f8021: chore: initial commit

### Patch Changes

- Updated dependencies [62f8021]
  - @openenvx/core@0.1.0
  - @openenvx/preview@0.1.0
  - @openenvx/schema@0.1.0
