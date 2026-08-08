import {
  Command,
  findLayerById,
  getActivePage,
  localize,
  updateLayerInTree,
} from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';
import type { Transform } from '@xmazu/openenvxee-schema';

import { alignTransforms, distributeHorizontally } from '../layer-align/align';

type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function getSelectedTransforms(ctx: CommandContext): {
  layerIds: string[];
  transforms: Transform[];
} {
  const scene = ctx.scene.getScene();
  const page = getActivePage(scene);
  if (page.layout !== 'absolute') {
    return { layerIds: [], transforms: [] };
  }
  const pairs = ctx.selection.selectedLayerIds.flatMap((layerId) => {
    const transform = findLayerById(scene, layerId)?.transform;
    return transform ? [{ layerId, transform }] : [];
  });
  return {
    layerIds: pairs.map((pair) => pair.layerId),
    transforms: pairs.map((pair) => pair.transform),
  };
}

function applyTransforms(
  ctx: CommandContext,
  layerIds: string[],
  transforms: Transform[],
  labelKey: string,
  defaultLabel: string
): void {
  const activePageId = ctx.scene.getActivePageId();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      pages: scene.pages.map((page) =>
        page.id === activePageId
          ? {
              ...page,
              layers: layerIds.reduce(
                (layers, layerId, index) =>
                  updateLayerInTree(layers, layerId, (layer) => ({
                    ...layer,
                    transform: transforms[index] ?? layer.transform,
                  })),
                page.layers
              ),
            }
          : page
      ),
    }),
    label: localize(ctx.services, labelKey, { defaultValue: defaultLabel }),
  });
}

abstract class AlignLayersCommandBase extends Command {
  abstract readonly alignment: AlignMode;
  abstract readonly id: string;
  abstract readonly labelKey: string;
  abstract readonly defaultLabel: string;

  canExecute(ctx: CommandContext): boolean {
    return getSelectedTransforms(ctx).transforms.length >= 2;
  }

  execute(ctx: CommandContext): void {
    const { layerIds, transforms } = getSelectedTransforms(ctx);
    if (transforms.length < 2) {
      return;
    }
    const aligned = alignTransforms(transforms, this.alignment);
    applyTransforms(ctx, layerIds, aligned, this.labelKey, this.defaultLabel);
  }
}

export class AlignLayersLeftCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignLeft';
  readonly alignment = 'left' as const;
  readonly labelKey = 'canvas.history.alignLeft';
  readonly defaultLabel = 'Align left';
}

export class AlignLayersCenterCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignCenter';
  readonly alignment = 'center' as const;
  readonly labelKey = 'canvas.history.alignCenter';
  readonly defaultLabel = 'Align center';
}

export class AlignLayersRightCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignRight';
  readonly alignment = 'right' as const;
  readonly labelKey = 'canvas.history.alignRight';
  readonly defaultLabel = 'Align right';
}

export class AlignLayersTopCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignTop';
  readonly alignment = 'top' as const;
  readonly labelKey = 'canvas.history.alignTop';
  readonly defaultLabel = 'Align top';
}

export class AlignLayersMiddleCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignMiddle';
  readonly alignment = 'middle' as const;
  readonly labelKey = 'canvas.history.alignMiddle';
  readonly defaultLabel = 'Align middle';
}

export class AlignLayersBottomCommand extends AlignLayersCommandBase {
  readonly id = 'canvas.alignBottom';
  readonly alignment = 'bottom' as const;
  readonly labelKey = 'canvas.history.alignBottom';
  readonly defaultLabel = 'Align bottom';
}

export class AlignLayersCommand extends Command {
  readonly id = 'canvas.align';

  canExecute(ctx: CommandContext, args?: unknown): boolean {
    if (!args || typeof args !== 'object' || !('alignment' in args)) {
      return false;
    }
    return getSelectedTransforms(ctx).transforms.length >= 2;
  }

  execute(ctx: CommandContext, args?: unknown): void {
    const alignment = (args as { alignment?: AlignMode } | undefined)
      ?.alignment;
    if (!alignment) {
      return;
    }
    const { layerIds, transforms } = getSelectedTransforms(ctx);
    if (transforms.length < 2) {
      return;
    }
    const aligned = alignTransforms(transforms, alignment);
    applyTransforms(
      ctx,
      layerIds,
      aligned,
      `canvas.history.align.${alignment}`,
      `Align ${alignment}`
    );
  }
}

export class DistributeLayersHorizontallyCommand extends Command {
  readonly id = 'canvas.distributeHorizontal';

  canExecute(ctx: CommandContext): boolean {
    return getSelectedTransforms(ctx).transforms.length >= 3;
  }

  execute(ctx: CommandContext): void {
    const { layerIds, transforms } = getSelectedTransforms(ctx);
    if (transforms.length < 3) {
      return;
    }
    const distributed = distributeHorizontally(transforms);
    applyTransforms(
      ctx,
      layerIds,
      distributed,
      'canvas.history.distributeHorizontal',
      'Distribute horizontally'
    );
  }
}
