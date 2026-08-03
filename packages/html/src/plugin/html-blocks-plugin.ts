import { OpenEnvxWidgetLayer, SimpleServiceContribution } from '@openenvx/core';
import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import {
  BlockRegistryServiceId,
  defaultBlockRegistry,
} from '../block-registry';
import { builtinBlocks } from '../blocks/builtin-blocks';
import { openenvxWidgetBlock } from '../blocks/openenvx-widget-block';
import { createBlockCommands } from '../commands/create-block-commands';
import {
  HtmlBlocksContainer,
  HtmlBlocksView,
  HTML_BLOCKS_PANEL_COMPONENT_ID,
} from '../contributions/html-blocks-sidebar';
import { HtmlContextMenu } from '../contributions/html-context-menu';
import { createHtmlLayerDefinition } from '../create-html-layer-definition';
import { BlockPalettePanel } from '../editor/block-palette-panel';
import { HtmlEditorPane } from '../editor/html-editor-pane';
import { registerHtmlPreviewChrome } from '../preview/register-html-preview-chrome';

export class HtmlBlocksPlugin extends WorkbenchPlugin {
  readonly id = 'OpenEnvx.html-blocks';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    for (const block of builtinBlocks) {
      defaultBlockRegistry.register(block);
    }
    defaultBlockRegistry.register(openenvxWidgetBlock);

    ctx.register(
      new SimpleServiceContribution(
        BlockRegistryServiceId,
        () => defaultBlockRegistry
      ),
      ...builtinBlocks.map((block) => createHtmlLayerDefinition(block)),
      new OpenEnvxWidgetLayer(),
      ...createBlockCommands({
        prefix: 'html',
        rootType: 'html.root',
        registryServiceId: BlockRegistryServiceId,
      })
    );
    registerHtmlPreviewChrome(ctx);

    ctx.registerWorkbench(
      new HtmlContextMenu(),
      new HtmlBlocksContainer(),
      new HtmlBlocksView()
    );
    ctx.registerViewPanel(HTML_BLOCKS_PANEL_COMPONENT_ID, BlockPalettePanel);
    ctx.registerEditorPane('html', HtmlEditorPane);
  }
}
