import { getChildNodes, requireDocumentStore } from '@openenvx/editor';
import type { DocumentNode } from '@openenvx/editor/schema';
import { artboardRulesLayout } from '@openenvx/editor/schema';
import { Command, localize } from '@openenvx/studio';
import type { CommandContext } from '@openenvx/studio';

import { CanvasGroupLayer } from '../layers/canvas-group-layer';
import {
  findSelectedRootGroup,
  groupRootLayers,
  isRootLevelSelection,
  ungroupLayer,
} from '../scene/group-layers';

function createNodeId(type: string): string {
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
  const page = requireDocumentStore(ctx).getActiveArtboard();
  requireDocumentStore(ctx).apply({
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
  requireDocumentStore(ctx).setSession({
    activeArtboardId: page.id,
    ...selection,
  });
}

export class InsertCanvasGroupCommand extends Command {
  readonly id = 'canvas.insertGroup';

  canExecute(ctx: CommandContext): boolean {
    const page = requireDocumentStore(ctx).getActiveArtboard();
    return artboardRulesLayout(page) === 'absolute';
  }

  execute(ctx: CommandContext): void {
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const layer = new CanvasGroupLayer().createDefault(
      createNodeId('group'),
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
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const { selectedNodeIds } = requireDocumentStore(ctx).getSession();
    return (
      artboardRulesLayout(page) === 'absolute' &&
      selectedNodeIds.length >= 2 &&
      isRootLevelSelection(page.nodes, selectedNodeIds)
    );
  }

  execute(ctx: CommandContext): void {
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const { selectedNodeIds } = requireDocumentStore(ctx).getSession();
    const groupId = createNodeId('group');
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
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const { selectedNodeIds } = requireDocumentStore(ctx).getSession();
    return findSelectedRootGroup(page.nodes, selectedNodeIds) !== null;
  }

  execute(ctx: CommandContext): void {
    const page = requireDocumentStore(ctx).getActiveArtboard();
    const { selectedNodeIds } = requireDocumentStore(ctx).getSession();
    const group = findSelectedRootGroup(page.nodes, selectedNodeIds);
    if (!group) {
      return;
    }
    const nextLayers = ungroupLayer(page.nodes, group.id);
    const childIds = getChildNodes(group).map((child) => child.id);
    applyPageLayers(ctx, nextLayers, {
      selectedNodeIds: childIds,
      primaryNodeId: childIds[0] ?? null,
    });
  }
}
