import {
  createHtmlLayerDefinition,
  defaultBlockRegistry,
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/html-studio';

import {
  eventGalleryBlock,
  eventHeroBlock,
  eventLogoBlock,
  eventPageBlock,
} from './blocks';

import './snapvelo-theme.css';

const snapveloBlocks = [
  eventPageBlock,
  eventHeroBlock,
  eventLogoBlock,
  eventGalleryBlock,
];

export class SnapveloEventPagePlugin extends WorkbenchPlugin {
  readonly id = 'snapvelo.event-page';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    for (const block of snapveloBlocks) {
      defaultBlockRegistry.register(block);
    }
    ctx.register(
      ...snapveloBlocks.map((block) => createHtmlLayerDefinition(block))
    );
    // Fluid/fit frame fights the fixed Chivent template width — hide it here.
    // ctx.contextKeys.setContext('html.hideFluidPreset', true);
  }
}
