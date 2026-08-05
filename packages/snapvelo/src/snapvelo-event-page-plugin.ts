import {
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/headless';
import {
  createHtmlLayerDefinition,
  defaultBlockRegistry,
} from '@openenvx/html';

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
  }
}
