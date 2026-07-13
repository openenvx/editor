import { Command, getActivePage, localize } from '@openenvx/core';
import type { CommandContext } from '@openenvx/core';

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
  layers: ReturnType<typeof getActivePage>['layers'],
  selection: {
    selectedLayerIds: string[];
    primaryLayerId: string | null;
  }
): void {
  const page = getActivePage(ctx.scene.getScene());
  ctx.scene.apply({
    apply: (scene) => ({
      ...scene,
      pages: scene.pages.map((p) => (p.id === page.id ? { ...p, layers } : p)),
      selection: {
        activePageId: page.id,
        ...selection,
      },
    }),
    label: localize(ctx.services, 'canvas.history.groupLayers', {
      defaultValue: 'Group layers',
    }),
  });
}

export class InsertCanvasGroupCommand extends Command {
  readonly id = 'canvas.insertGroup';

  canExecute(ctx: CommandContext): boolean {
    const page = getActivePage(ctx.scene.getScene());
    return page.layout === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const layer = new CanvasGroupLayer().createDefault(
      createLayerId('group'),
      page
    );
    applyPageLayers(ctx, [...page.layers, layer], {
      selectedLayerIds: [layer.id],
      primaryLayerId: layer.id,
    });
  }
}

export class GroupSelectionCommand extends Command {
  readonly id = 'canvas.groupSelection';

  canExecute(ctx: CommandContext): boolean {
    const page = getActivePage(ctx.scene.getScene());
    const { selectedLayerIds } = ctx.scene.getScene().selection;
    return (
      page.layout === 'absolute' &&
      selectedLayerIds.length >= 2 &&
      isRootLevelSelection(page.layers, selectedLayerIds)
    );
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const { selectedLayerIds } = ctx.scene.getScene().selection;
    const groupId = createLayerId('group');
    const nextLayers = groupRootLayers(
      page.layers,
      selectedLayerIds,
      groupId,
      page
    );
    applyPageLayers(ctx, nextLayers, {
      selectedLayerIds: [groupId],
      primaryLayerId: groupId,
    });
  }
}

export class UngroupSelectionCommand extends Command {
  readonly id = 'canvas.ungroup';

  canExecute(ctx: CommandContext): boolean {
    const page = getActivePage(ctx.scene.getScene());
    const { selectedLayerIds } = ctx.scene.getScene().selection;
    return findSelectedRootGroup(page.layers, selectedLayerIds) !== null;
  }

  execute(ctx: CommandContext): void {
    const page = getActivePage(ctx.scene.getScene());
    const { selectedLayerIds } = ctx.scene.getScene().selection;
    const group = findSelectedRootGroup(page.layers, selectedLayerIds);
    if (!group) {
      return;
    }
    const nextLayers = ungroupLayer(page.layers, group.id);
    const childIds = (
      group.data as { children: { id: string }[] }
    ).children.map((child) => child.id);
    applyPageLayers(ctx, nextLayers, {
      selectedLayerIds: childIds,
      primaryLayerId: childIds[0] ?? null,
    });
  }
}
