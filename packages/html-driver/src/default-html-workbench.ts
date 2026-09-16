import { VariablesPlugin } from '@openenvx/variables';

import { DEFAULT_HTML_LAYOUT } from './default-html-layout';
import { HtmlBlocksPlugin } from './plugin/html-blocks-plugin';

/** Default plugins for an HTML block workbench host app. */
export const DEFAULT_HTML_WORKBENCH_PLUGINS = [
  new HtmlBlocksPlugin(),
  new VariablesPlugin(),
];

/**
 * Default workbench wiring for HTML artboard hosts.
 * For custom plugin lists, use `new HtmlBlocksPlugin()` plus your plugins;
 * `DEFAULT_HTML_WORKBENCH_PLUGINS` also includes `VariablesPlugin`.
 */
export const defaultHtmlWorkbench = {
  plugins: DEFAULT_HTML_WORKBENCH_PLUGINS,
  layout: DEFAULT_HTML_LAYOUT,
};
