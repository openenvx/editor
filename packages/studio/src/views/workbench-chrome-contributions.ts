import {
  getChildNodes,
  hasChildNodes,
  isLayerEditable,
  isLayerLocked,
  isLayerShownInLayers,
  isLayerVisible,
  isLayerWritable,
  isLayoutRootLayer,
  isTemplatePolicyEnforced,
  localize,
  moveNodeRelativeToTarget,
  movePageRelativeToTarget,
  LayerRegistryServiceId,
  StatusBarContribution,
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  type StatusBarBuilder,
  type TreeItem,
  type TreeSelectOptions,
  type CommandContext,
  type DocumentNode,
} from '#studio';
import type { Artboard } from '#studio/schema';

export const WORKBENCH_SIDEBAR_CONTAINER_ID = 'workbench.sidebar';
export const WORKBENCH_PAGES_VIEW_ID = 'workbench.artboards';
export const WORKBENCH_LAYERS_VIEW_ID = 'workbench.nodes';

export { isLayoutRootLayer };

export class PagesTreeProvider extends TreeDataProvider<Artboard> {
  getRootChildren(ctx: CommandContext): Artboard[] {
    return ctx.scene.getDocument().artboards;
  }

  getChildren(): Artboard[] {
    return [];
  }

  getTreeItem(page: Artboard, _ctx: CommandContext): TreeItem {
    return {
      editLabel: page.name ?? '',
      icon: 'file',
      id: page.id,
      label: page.name?.trim() ? page.name : 'Artboard',
      renameCommandId: 'scene.renamePage',
    };
  }

  onSelect(page: Artboard, ctx: CommandContext): void {
    ctx.scene.setActiveArtboard(page.id);
  }

  canMove(
    source: Artboard,
    target: Artboard,
    position: 'before' | 'after' | 'inside'
  ): boolean {
    return source.id !== target.id && position !== 'inside';
  }

  handleMove(
    source: Artboard,
    target: Artboard,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const effectivePosition = position === 'inside' ? 'after' : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: movePageRelativeToTarget(
          scene.artboards,
          source.id,
          target.id,
          effectivePosition
        ),
      }),
      label: localize(ctx.services, 'workbench.history.reorderArtboard', {
        defaultValue: 'Reorder page',
      }),
    });
  }
}

export class LayersTreeProvider extends TreeDataProvider<DocumentNode> {
  getRootChildren(ctx: CommandContext): DocumentNode[] {
    const layers = ctx.scene.getActiveArtboard().nodes;
    if (!isTemplatePolicyEnforced()) {
      return layers;
    }
    return layers.filter((layer) => isLayerShownInLayers(layer));
  }

  getChildren(node: DocumentNode): DocumentNode[] {
    const children = getChildNodes(node);
    if (!isTemplatePolicyEnforced()) {
      return children;
    }
    return children.filter((layer) => isLayerShownInLayers(layer));
  }

  getTreeItem(node: DocumentNode, ctx: CommandContext): TreeItem {
    const layers = ctx.services.has(LayerRegistryServiceId)
      ? ctx.services.get(LayerRegistryServiceId)
      : undefined;
    const definition = layers?.get(node.type);
    const configLocked = !isLayerEditable(node);
    const runtimeLocked = isLayerLocked(node);
    const layerVisible = isLayerVisible(node);
    const tooltip = configLocked
      ? 'This layer cannot be edited from the editor'
      : runtimeLocked
        ? 'Unlock layer (Mod+L)'
        : 'Lock layer (Mod+L)';
    const fallbackLabel = node.type.includes('.')
      ? node.type.slice(node.type.indexOf('.') + 1)
      : node.type;
    return {
      // Nestable even when empty (email.section/row/column, html.flex, …).
      collapsible: hasChildNodes(node),
      editLabel: node.name ?? '',
      icon: definition?.treeIcon,
      id: node.id,
      label: definition?.treeLabel(node) ?? fallbackLabel,
      locked: configLocked || runtimeLocked,
      lockedCommandId: configLocked ? undefined : 'scene.toggleLayerLock',
      renameCommandId: 'scene.renameLayer',
      tooltip,
      visible: layerVisible,
      visibilityCommandId: configLocked
        ? undefined
        : 'scene.toggleLayerVisibility',
    };
  }

  onSelect(
    node: DocumentNode,
    ctx: CommandContext,
    options?: TreeSelectOptions
  ): void {
    if (!isLayerEditable(node)) {
      return;
    }
    if (options?.additive) {
      const current = ctx.selection.selectedNodeIds;
      if (current.includes(node.id)) {
        const next = current.filter((id) => id !== node.id);
        ctx.scene.selectNodes(next, next[0] ?? null);
        return;
      }
      ctx.scene.selectNodes(
        [...current, node.id],
        ctx.selection.primaryNodeId ?? node.id
      );
      return;
    }
    ctx.scene.selectNodes([node.id], node.id);
  }

  canMove(
    source: DocumentNode,
    target: DocumentNode,
    position: 'before' | 'after' | 'inside'
  ): boolean {
    if (
      source.id === target.id ||
      !isLayerWritable(source) ||
      !isLayerWritable(target)
    ) {
      return false;
    }
    // Artboard/Email frame stays the sole top-level row - never move it or hoist beside it.
    if (isLayoutRootLayer(source)) {
      return false;
    }
    if (
      isLayoutRootLayer(target) &&
      (position === 'before' || position === 'after')
    ) {
      return false;
    }
    if (position === 'inside' && !hasChildNodes(target)) {
      return false;
    }
    return true;
  }

  handleMove(
    source: DocumentNode,
    target: DocumentNode,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const page = ctx.scene.getActiveArtboard();
    // Nest into real containers; flat canvas rows still treat "inside" as sibling after.
    const effectivePosition =
      position === 'inside' && hasChildNodes(target)
        ? 'inside'
        : position === 'inside'
          ? 'after'
          : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        artboards: scene.artboards.map((p) =>
          p.id === page.id
            ? {
                ...p,
                nodes: moveNodeRelativeToTarget(
                  p.nodes,
                  source.id,
                  target.id,
                  effectivePosition
                ),
              }
            : p
        ),
      }),
      label: localize(ctx.services, 'workbench.history.reorderLayer', {
        defaultValue: 'Reorder layer',
      }),
    });
  }
}

export class WorkbenchPagesView extends ViewContribution {
  readonly id = WORKBENCH_PAGES_VIEW_ID;
  readonly containerId = WORKBENCH_SIDEBAR_CONTAINER_ID;
  readonly name = 'Artboards';
  readonly viewOrder = 0;
  readonly viewSelection = 'page' as const;
  readonly viewHover = 'none' as const;
}

export class WorkbenchLayersView extends ViewContribution {
  readonly id = WORKBENCH_LAYERS_VIEW_ID;
  readonly containerId = WORKBENCH_SIDEBAR_CONTAINER_ID;
  readonly name = 'Layers';
  readonly viewOrder = 10;
  readonly viewHover = 'layer' as const;
  /** Flat under the Layers container - document `*.root` is the tree root. */
  readonly collapsible = false;
}

export class WorkbenchSidebarContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_SIDEBAR_CONTAINER_ID;
  readonly title = 'Layers';
  readonly icon = 'layers';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 10;
}

/** Generic dirty indicators - canvas zoom/selection stay in `@openenvx/canvas-driver`. */
export class WorkbenchStatusBarContribution extends StatusBarContribution {
  contribute(builder: StatusBarBuilder, _ctx: CommandContext): void {
    builder
      .right()
      .text('Saved', { id: 'workbench-saved', when: '!editor.dirty' })
      .text('Unsaved', { id: 'workbench-unsaved', when: 'editor.dirty' });
  }
}
