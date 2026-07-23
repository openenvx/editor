import { HtmlBlocksPlugin } from '@openenvx/html';

export * from '@openenvx/core';
export * from '@openenvx/headless';
export * from '@xmazu/openenvxee-workbench';
export * from '@openenvx/html';

/** Default plugins for an HTML block studio host app. */
export const DEFAULT_HTML_STUDIO_PLUGINS = [new HtmlBlocksPlugin()];
