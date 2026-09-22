import type { WorkbenchLayout } from '@openenvx/studio';
import { DEFAULT_WORKBENCH_LAYOUT } from '@openenvx/studio';

/** Canvas product layout - top bar + editor overlay toolbars (bottom-center). */
export const DEFAULT_CANVAS_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_WORKBENCH_LAYOUT,
  editorToolbars: true,
  topBar: true,
};
