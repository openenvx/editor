import type { WorkbenchLayout } from '@openenvx/headless';
import { DEFAULT_WORKBENCH_LAYOUT } from '@openenvx/headless';

/** Canvas product layout — enables editor overlay toolbars (bottom-center). */
export const DEFAULT_CANVAS_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_WORKBENCH_LAYOUT,
  editorToolbars: true,
};
