import { Command, localize, getLayerChildren } from '@openenvx/studio';
import type { CommandContext } from '@openenvx/studio';
import type { DocumentNode } from '@openenvx/studio/schema';
import { artboardRulesLayout } from '@openenvx/studio/schema';

import { CanvasGroupLayer } from '../layers/canvas-group-layer';
import {
  findSelectedRootGroup,
  groupRootLayers,
  isRootLevelSelection,
  ungroupLayer,
} from '../scene/group-layers';

function createLayerId(type: string): string {
  return `${type}-${crypto.randomUUID()}`;
}

function applyPageLayers(
  ctx: CommandContext,
  nodes: DocumentNode[],
  selection: {
    selectedNodeIds: string[];
    primaryNodeId: string | null;
  }
): void {
  const page = ctx.scene.getActiveArtboard();
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      artboards: scene.artboards.map((p) =>
        p.id === page.id ? { ...p, nodes } : p
      ),
    }),
    label: localize(ctx.services, 'canvas.history.groupLayers', {
      defaultValue: 'Group layers',
    }),
  });
  ctx.scene.setSelection({
    activeArtboardId: page.id,
    ...selection,
  });
}

export class InsertCanvasGroupCommand extends Command {
  readonly id = 'canvas.insertGroup';

  canExecute(ctx: CommandContext): boolean {
    const page = ctx.scene.getActiveArtboard();
    return artboardRulesLayout(page) === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActiveArtboard();
    const layer = new CanvasGroupLayer().createDefault(
      createLayerId('group'),
      page
    );
    applyPageLayers(ctx, [...page.nodes, layer], {
      selectedNodeIds: [layer.id],
      primaryNodeId: layer.id,
    });
  }
}

export class GroupSelectionCommand extends Command {
  readonly id = 'canvas.groupSelection';

  canExecute(ctx: CommandContext): boolean {
    const page = ctx.scene.getActiveArtboard();
    const { selectedNodeIds } = ctx.selection;
    return (
      artboardRulesLayout(page) === 'absolute' &&
      selectedNodeIds.length >= 2 &&
      isRootLevelSelection(page.nodes, selectedNodeIds)
    );
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActiveArtboard();
    const { selectedNodeIds } = ctx.selection;
    const groupId = createLayerId('group');
    const nextLayers = groupRootLayers(
      page.nodes,
      selectedNodeIds,
      groupId,
      page
    );
    applyPageLayers(ctx, nextLayers, {
      selectedNodeIds: [groupId],
      primaryNodeId: groupId,
    });
  }
}

export class UngroupSelectionCommand extends Command {
  readonly id = 'canvas.ungroup';

  canExecute(ctx: CommandContext): boolean {
    const page = ctx.scene.getActiveArtboard();
    const { selectedNodeIds } = ctx.selection;
    return findSelectedRootGroup(page.nodes, selectedNodeIds) !== null;
  }

  execute(ctx: CommandContext): void {
    const page = ctx.scene.getActiveArtboard();
    const { selectedNodeIds } = ctx.selection;
    const group = findSelectedRootGroup(page.nodes, selectedNodeIds);
    if (!group) {
      return;
    }
    const nextLayers = ungroupLayer(page.nodes, group.id);
    const childIds = getLayerChildren(group).map((child) => child.id);
    applyPageLayers(ctx, nextLayers, {
      selectedNodeIds: childIds,
      primaryNodeId: childIds[0] ?? null,
    });
  }
}
