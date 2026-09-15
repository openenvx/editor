import { VariablesPlugin } from '@openenvx/variables';

import { DEFAULT_EMAIL_LAYOUT } from '../default-email-layout';
import { EmailBlocksPlugin } from '../plugin/email-blocks-plugin';

/** Default plugins for an email studio host app. */
export const DEFAULT_EMAIL_STUDIO_PLUGINS = [
  new EmailBlocksPlugin(),
  new VariablesPlugin(),
];

/** Drop-in layout: top bar + bottom insert toolbar + inspector (no activity bar / left sidebar). */
const EMAIL_EDITOR_LAYOUT = {
  ...DEFAULT_EMAIL_LAYOUT,
  activityBar: false,
  primarySidebar: false,
  statusBar: false,
  editorToolbars: true,
};

/** Default workbench wiring for email artboard hosts. */
export const defaultEmailStudio = {
  plugins: DEFAULT_EMAIL_STUDIO_PLUGINS,
  layout: EMAIL_EDITOR_LAYOUT,
};
