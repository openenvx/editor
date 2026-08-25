import { DEFAULT_WORKBENCH_LAYOUT, type WorkbenchLayout } from '@openenvx/core';

/** Email editor layout — chrome lives in the top bar, not floating artboard toolbars. */
export const DEFAULT_EMAIL_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_WORKBENCH_LAYOUT,
  editorToolbars: false,
};
