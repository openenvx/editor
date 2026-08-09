import type { WorkbenchLayout } from '@openenvx/core';
import { DEFAULT_WORKBENCH_LAYOUT } from '@openenvx/core';

/** Canvas product layout — enables editor overlay toolbars (bottom-center). */
export const DEFAULT_CANVAS_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_WORKBENCH_LAYOUT,
  editorToolbars: true,
};
