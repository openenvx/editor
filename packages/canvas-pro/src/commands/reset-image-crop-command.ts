import { Command, localize, updateLayerInTree } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

import { hasActiveCrop, readImageCrop } from '../crop/normalized-crop';

export class ResetImageCropCommand extends Command {
  readonly id = 'canvas.resetImageCrop';

  canExecute(ctx: CommandContext): boolean {
    const layer = ctx.scene.getPrimaryLayer();
    if (!layer || layer.type !== 'canvas.image') {
      return false;
    }
    const data = layer.data as Record<string, unknown>;
    return hasActiveCrop(
      readImageCrop({ crop: data.crop, kind: 'image', src: '' })
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
        pages: scene.pages.map((page) => ({
          ...page,
          layers: updateLayerInTree(page.layers, layer.id, (entry) => {
            const data =
              typeof entry.data === 'object' && entry.data !== null
                ? { ...(entry.data as Record<string, unknown>) }
                : {};
            delete data.crop;
            return {
              ...entry,
              data,
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
