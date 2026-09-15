import { VariablesPlugin } from '@openenvx/variables';

import { DEFAULT_HTML_LAYOUT } from '../default-html-layout';
import { HtmlBlocksPlugin } from '../plugin/html-blocks-plugin';

/** Default plugins for an HTML block studio host app. */
export const DEFAULT_HTML_STUDIO_PLUGINS = [
  new HtmlBlocksPlugin(),
  new VariablesPlugin(),
];

/** Default workbench wiring for HTML artboard hosts. */
export const defaultHtmlStudio = {
  plugins: DEFAULT_HTML_STUDIO_PLUGINS,
  layout: DEFAULT_HTML_LAYOUT,
};
