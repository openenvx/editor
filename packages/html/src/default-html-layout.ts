import {
  DEFAULT_WORKBENCH_LAYOUT,
  type WorkbenchLayout,
} from '@openenvx/headless';

/** Layout defaults for HTML / email hosts (editor overlay toolbars on). */
export const DEFAULT_HTML_LAYOUT: WorkbenchLayout = {
  ...DEFAULT_WORKBENCH_LAYOUT,
  editorToolbars: true,
};
