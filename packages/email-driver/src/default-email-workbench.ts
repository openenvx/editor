import { VariablesPlugin } from '@openenvx/variables';

import { DEFAULT_EMAIL_LAYOUT } from './default-email-layout';
import { EmailBlocksPlugin } from './plugin/email-blocks-plugin';

/** Default plugins for an email workbench host app. */
export const DEFAULT_EMAIL_WORKBENCH_PLUGINS = [
  new EmailBlocksPlugin(),
  new VariablesPlugin(),
];

/** Editor layout: top bar + bottom insert toolbar + inspector (no activity bar / left sidebar). */
const EMAIL_EDITOR_LAYOUT = {
  ...DEFAULT_EMAIL_LAYOUT,
  activityBar: false,
  primarySidebar: false,
  statusBar: false,
  editorToolbars: true,
};

/**
 * Default workbench wiring for email artboard hosts.
 * For custom plugin lists, use `new EmailBlocksPlugin()` plus your plugins;
 * `DEFAULT_EMAIL_WORKBENCH_PLUGINS` also includes `VariablesPlugin`.
 */
export const defaultEmailWorkbench = {
  plugins: DEFAULT_EMAIL_WORKBENCH_PLUGINS,
  layout: EMAIL_EDITOR_LAYOUT,
};
