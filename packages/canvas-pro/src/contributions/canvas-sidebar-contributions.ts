import {
  getContainerChildren,
  isLayerEditable,
  isLayerLocked,
  isLayerVisible,
  isLayerWritable,
  localize,
  moveLayerRelativeToTarget,
  movePageRelativeToTarget,
  LayerRegistryServiceId,
} from '@openenvx/core';
import type { CommandContext, Layer } from '@openenvx/core';
import {
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  type TreeItem,
} from '@openenvx/headless';
import type { Page } from '@openenvx/schema';

export class CanvasPagesTreeProvider extends TreeDataProvider<Page> {
  getRootChildren(ctx: CommandContext): Page[] {
    return ctx.scene.getScene().pages;
  }

  getChildren(): Page[] {
    return [];
  }

  getTreeItem(page: Page, _ctx: CommandContext): TreeItem {
    return {
      editLabel: page.name ?? '',
      icon: 'file',
      id: page.id,
      label: page.name?.trim() ? page.name : 'Page',
      renameCommandId: 'scene.renamePage',
    };
  }

  onSelect(page: Page, ctx: CommandContext): void {
    ctx.scene.setActivePage(page.id);
  }

  canMove(
    source: Page,
    target: Page,
    position: 'before' | 'after' | 'inside'
  ): boolean {
    return source.id !== target.id && position !== 'inside';
  }

  handleMove(
    source: Page,
    target: Page,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const effectivePosition = position === 'inside' ? 'after' : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: movePageRelativeToTarget(
          scene.pages,
          source.id,
          target.id,
          effectivePosition
        ),
      }),
      label: localize(ctx.services, 'canvas.history.reorderPage', {
        defaultValue: 'Reorder page',
      }),
    });
  }
}

export class CanvasLayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return ctx.scene.getActivePage().layers;
  }

  getChildren(node: Layer): Layer[] {
    return getContainerChildren(node);
  }

  getTreeItem(node: Layer, ctx: CommandContext): TreeItem {
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
    return {
      editLabel: node.name ?? '',
      icon: definition?.treeIcon,
      id: node.id,
      label: definition?.treeLabel(node) ?? node.type.replace('canvas.', ''),
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

  onSelect(node: Layer, ctx: CommandContext): void {
    if (!isLayerEditable(node)) {
      return;
    }
    ctx.scene.selectLayers([node.id], node.id);
  }

  canMove(
    source: Layer,
    target: Layer,
    _position: 'before' | 'after' | 'inside'
  ): boolean {
    return (
      source.id !== target.id &&
      isLayerWritable(source) &&
      isLayerWritable(target)
    );
  }

  handleMove(
    source: Layer,
    target: Layer,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void {
    const page = ctx.scene.getActivePage();
    const effectivePosition = position === 'inside' ? 'after' : position;
    ctx.scene.apply({
      apply: (scene) => ({
        ...scene,
        pages: scene.pages.map((p) =>
          p.id === page.id
            ? {
                ...p,
                layers: moveLayerRelativeToTarget(
                  p.layers,
                  source.id,
                  target.id,
                  effectivePosition
                ),
              }
            : p
        ),
      }),
      label: localize(ctx.services, 'canvas.history.reorderLayer', {
        defaultValue: 'Reorder layer',
      }),
    });
  }
}

export class CanvasPagesView extends ViewContribution {
  readonly id = 'canvas.pages';
  readonly containerId = 'canvas.sidebar';
  readonly name = 'Pages';
  readonly viewOrder = 0;
  readonly viewSelection = 'page' as const;
  readonly viewHover = 'none' as const;
}

export class CanvasLayersView extends ViewContribution {
  readonly id = 'canvas.layers';
  readonly containerId = 'canvas.sidebar';
  readonly name = 'Layers';
  readonly viewOrder = 10;
  readonly viewHover = 'layer' as const;
}

export class CanvasSidebarContainer extends ViewContainerContribution {
  readonly id = 'canvas.sidebar';
  readonly title = 'Layers';
  readonly icon = 'layers';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 10;
}
