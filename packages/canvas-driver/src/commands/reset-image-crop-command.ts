import { Command, localize, updateLayerInTree } from '@openenvx/studio/core';
import type { CommandContext } from '@openenvx/studio/core';

import { hasActiveCrop, readImageCrop } from '../crop/normalized-crop';

export class ResetImageCropCommand extends Command {
  readonly id = 'canvas.resetImageCrop';

  canExecute(ctx: CommandContext): boolean {
    const layer = ctx.scene.getPrimaryLayer();
    if (!layer || layer.type !== 'canvas.image') {
      return false;
    }
    const props = (layer.props ?? {}) as Record<string, unknown>;
    return hasActiveCrop(
      readImageCrop({ crop: props.crop, kind: 'image', src: '' })
    );
  }

  execute(ctx: CommandContext): void {
    const layer = ctx.scene.getPrimaryLayer();
    if (!layer) {
      return;
    }

    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((page) => ({
          ...page,
          nodes: updateLayerInTree(page.nodes, layer.id, (entry) => {
            const props =
              typeof entry.props === 'object' && entry.props !== null
                ? { ...(entry.props as Record<string, unknown>) }
                : {};
            delete props.crop;
            return {
              ...entry,
              props,
            };
          }),
        })),
      }),
      label: localize(ctx.services, 'canvas.history.resetImageCrop', {
        defaultValue: 'Reset image crop',
      }),
    });
  }
}
