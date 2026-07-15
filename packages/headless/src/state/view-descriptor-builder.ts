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
} from '../contributions/view-contribution';
import type { ViewProviderRegistry } from '../registries/view-provider-registry';
import type {
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewTreeItem,
} from '../workbench-state';

export function buildViewContainer(
  container: ViewContainerContribution,
  views: ViewContribution[],
  viewProviderRegistry: ViewProviderRegistry,
  ctx: CommandContext,
  evaluateWhen: (when?: string) => boolean,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewContainerDescriptor {
  const containerViews = views
    .filter((v) => v.containerId === container.id)
    .filter((v) => evaluateWhen(v.when))
    .toSorted((a, b) => (a.viewOrder ?? 0) - (b.viewOrder ?? 0))
    .map((view) => {
      const provider = viewProviderRegistry.get(view.id);
      if (!provider) {
        return buildEmptyView(view, buildCtx);
      }
      return buildView(view, provider, ctx, buildCtx);
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
    menuItems,
    sidebarBehavior,
    sidebarGroup: container.sidebarGroup ?? 0,
    sidebarOrder: container.sidebarOrder ?? 0,
    title: buildCtx.t(`viewContainer.${container.id}.title`, container.title),
    views: containerViews,
  };
}

function buildEmptyView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    collapsible: view.collapsible ?? true,
    containerId: view.containerId,
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    items: [],
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    supportsReorder: false,
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
    viewHover: view.viewHover ?? 'layer',
  };
}

function buildView(
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
          hasChildren: true,
          icon: treeItem.icon,
          id: treeItem.id,
          label: treeItem.label,
          source: node,
        });
        continue;
      }
      items.push({
        depth,
        hasChildren: childrenResult.length > 0,
        icon: treeItem.icon,
        id: treeItem.id,
        label: treeItem.label,
        locked: treeItem.locked,
        lockedCommandId: treeItem.lockedCommandId,
        source: node,
        tooltip: treeItem.tooltip,
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
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    items,
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    supportsReorder: typeof provider.handleMove === 'function',
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
    viewHover: view.viewHover ?? 'layer',
  };
}
