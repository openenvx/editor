import type { CommandContext } from '@openenvx/core';
import { createContributionBuildContext } from '@openenvx/core';

import {
  createMenuBuilder,
  filterMenuByCanExecute,
  filterMenuByWhen,
  type MenuItemDescriptor,
} from '../builders/menu-builder';
import type {
  ViewContainerContribution,
  ViewContribution,
  TreeDataProvider,
  ViewContainerLocation,
} from '../contributions/view-contribution';
import type { ViewProviderRegistry } from '../registries/view-provider-registry';
import type {
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewTreeItem,
} from '../workbench-state';
import type { ViewLocationService } from '../workbench/view-location-service';

export function buildViewContainer(
  container: ViewContainerContribution,
  views: ViewContribution[],
  viewProviderRegistry: ViewProviderRegistry,
  ctx: CommandContext,
  evaluateWhen: (when?: string) => boolean,
  buildCtx: ReturnType<typeof createContributionBuildContext>,
  locationService: ViewLocationService
): ViewContainerDescriptor {
  const defaultLocation: ViewContainerLocation =
    container.defaultLocation ?? 'primary';
  locationService.ensureRegistered(container.id, defaultLocation);

  const containerViews = views
    .filter((v) => v.containerId === container.id)
    .filter((v) => evaluateWhen(v.when))
    .toSorted((a, b) => (a.viewOrder ?? 0) - (b.viewOrder ?? 0))
    .map((view) => {
      if (view.componentId) {
        return buildComponentView(view, buildCtx);
      }
      const provider = viewProviderRegistry.get(view.id);
      if (!provider) {
        return buildEmptyView(view, buildCtx);
      }
      return buildTreeView(view, provider, ctx, buildCtx);
    });

  const sidebarBehavior = container.sidebarBehavior ?? 'panel';
  let menuItems: MenuItemDescriptor[] | undefined;
  if (sidebarBehavior === 'dropdown' && container.contributeMenu) {
    const builder = createMenuBuilder();
    container.contributeMenu(builder, buildCtx);
    menuItems = filterMenuByCanExecute(
      filterMenuByWhen(builder.build(), evaluateWhen),
      buildCtx.canExecute
    );
  }

  return {
    commandId: container.commandId,
    icon: container.icon,
    id: container.id,
    location: locationService.getLocation(container.id),
    menuItems,
    sidebarBehavior,
    sidebarGroup: container.sidebarGroup ?? 0,
    sidebarOrder: container.sidebarOrder ?? 0,
    title: buildCtx.t(`viewContainer.${container.id}.title`, container.title),
    views: containerViews,
  };
}

function buildComponentView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    collapsible: view.collapsible ?? false,
    containerId: view.containerId,
    content: {
      componentId: view.componentId ?? view.id,
      kind: 'component',
    },
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    supportsReorder: false,
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
    viewHover: view.viewHover ?? 'none',
  };
}

function buildEmptyView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    collapsible: view.collapsible ?? true,
    containerId: view.containerId,
    content: { items: [], kind: 'tree' },
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    supportsReorder: false,
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
    viewHover: view.viewHover ?? 'layer',
  };
}

function buildTreeView(
  view: ViewContribution,
  provider: TreeDataProvider<unknown>,
  ctx: CommandContext,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  const items: ViewTreeItem[] = [];
  const walk = (nodes: unknown[], depth: number) => {
    for (const node of nodes) {
      const treeItem = provider.getTreeItem(node, ctx);
      const childrenResult = provider.getChildren(node, ctx);
      if (childrenResult instanceof Promise) {
        items.push({
          depth,
          editLabel: treeItem.editLabel,
          hasChildren: true,
          icon: treeItem.icon,
          id: treeItem.id,
          label: treeItem.label,
          renameCommandId: treeItem.renameCommandId,
          source: node,
        });
        continue;
      }
      items.push({
        depth,
        editLabel: treeItem.editLabel,
        hasChildren: childrenResult.length > 0,
        icon: treeItem.icon,
        id: treeItem.id,
        label: treeItem.label,
        locked: treeItem.locked,
        lockedCommandId: treeItem.lockedCommandId,
        renameCommandId: treeItem.renameCommandId,
        source: node,
        tooltip: treeItem.tooltip,
        visible: treeItem.visible,
        visibilityCommandId: treeItem.visibilityCommandId,
      });
      if (childrenResult.length > 0) {
        walk(childrenResult, depth + 1);
      }
    }
  };

  const roots = provider.getRootChildren(ctx);
  if (!(roots instanceof Promise)) {
    walk(roots, 0);
  }

  return {
    collapsible: view.collapsible ?? true,
    containerId: view.containerId,
    content: { items, kind: 'tree' },
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    supportsReorder: typeof provider.handleMove === 'function',
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
    viewHover: view.viewHover ?? 'layer',
  };
}
