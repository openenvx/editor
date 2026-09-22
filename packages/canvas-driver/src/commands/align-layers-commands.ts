import {
  Command,
  findNodeById,
  getActiveArtboard,
  localize,
  updateLayerInTree,
} from '@openenvx/studio';
import type { CommandContext } from '@openenvx/studio';
import {
  applyNodeTransform,
  artboardRulesLayout,
  nodeTransform,
  type Transform,
} from '@openenvx/studio/schema';

import { alignTransforms, distributeHorizontally } from '../layer-align/align';

type AlignMode = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

function getSelectedTransforms(ctx: CommandContext): {
  layerIds: string[];
  transforms: Transform[];
} {
  const scene = ctx.scene.getDocument();
  const page = getActiveArtboard(scene);
  if (artboardRulesLayout(page) !== 'absolute') {
    return { layerIds: [], transforms: [] };
  }
  const pairs = ctx.selection.selectedNodeIds.flatMap((layerId) => {
    const layer = findNodeById(scene, layerId);
    return layer ? [{ layerId, transform: nodeTransform(layer) }] : [];
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
  const activeArtboardId = ctx.scene.getActiveArtboardId();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      artboards: scene.artboards.map((page) =>
        page.id === activeArtboardId
          ? {
              ...page,
              nodes: layerIds.reduce(
                (nodes, layerId, index) =>
                  updateLayerInTree(nodes, layerId, (layer) =>
                    applyNodeTransform(
                      layer,
                      transforms[index] ?? nodeTransform(layer)
                    )
                  ),
                page.nodes
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
