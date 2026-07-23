import {
  getLayerChildren,
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
  StatusBarContribution,
  TreeDataProvider,
  ViewContainerContribution,
  ViewContribution,
  type StatusBarBuilder,
  type TreeItem,
} from '@openenvx/headless';
import type { Page } from '@openenvx/schema';

export const WORKBENCH_SIDEBAR_CONTAINER_ID = 'workbench.sidebar';
export const WORKBENCH_PAGES_VIEW_ID = 'workbench.pages';
export const WORKBENCH_LAYERS_VIEW_ID = 'workbench.layers';

export class PagesTreeProvider extends TreeDataProvider<Page> {
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
      label: localize(ctx.services, 'workbench.history.reorderPage', {
        defaultValue: 'Reorder page',
      }),
    });
  }
}

export class LayersTreeProvider extends TreeDataProvider<Layer> {
  getRootChildren(ctx: CommandContext): Layer[] {
    return ctx.scene.getActivePage().layers;
  }

  getChildren(node: Layer): Layer[] {
    return getLayerChildren(node);
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
    const fallbackLabel = node.type.includes('.')
      ? node.type.slice(node.type.indexOf('.') + 1)
      : node.type;
    return {
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
      label: localize(ctx.services, 'workbench.history.reorderLayer', {
        defaultValue: 'Reorder layer',
      }),
    });
  }
}

export class WorkbenchPagesView extends ViewContribution {
  readonly id = WORKBENCH_PAGES_VIEW_ID;
  readonly containerId = WORKBENCH_SIDEBAR_CONTAINER_ID;
  readonly name = 'Pages';
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
}

export class WorkbenchSidebarContainer extends ViewContainerContribution {
  readonly id = WORKBENCH_SIDEBAR_CONTAINER_ID;
  readonly title = 'Layers';
  readonly icon = 'layers';
  readonly sidebarBehavior = 'panel' as const;
  readonly sidebarGroup = 1;
  readonly sidebarOrder = 10;
}

/** Generic dirty indicators — canvas zoom/selection stay in canvas-pro. */
export class WorkbenchStatusBarContribution extends StatusBarContribution {
  contribute(builder: StatusBarBuilder, _ctx: CommandContext): void {
    builder
      .right()
      .text('Saved', { id: 'workbench-saved', when: '!editor.dirty' })
      .text('Unsaved', { id: 'workbench-unsaved', when: 'editor.dirty' });
  }
}
