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

function viewChrome(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): Pick<
  ViewDescriptor,
  | 'collapsible'
  | 'containerId'
  | 'group'
  | 'icon'
  | 'id'
  | 'initialCollapsed'
  | 'name'
  | 'viewHover'
  | 'viewOrder'
  | 'viewSelection'
> {
  return {
    collapsible: view.collapsible ?? false,
    containerId: view.containerId,
    ...(view.group ? { group: view.group } : {}),
    ...(view.icon ? { icon: view.icon } : {}),
    id: view.id,
    initialCollapsed: view.initialCollapsed ?? false,
    name: buildCtx.t(`view.${view.id}.name`, view.name),
    viewHover: view.viewHover ?? 'none',
    viewOrder: view.viewOrder ?? 0,
    viewSelection: view.viewSelection ?? 'layer',
  };
}

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
      if (typeof view.buildProperties === 'function') {
        return buildPropertiesView(view, buildCtx);
      }
      if (view.componentId) {
        return buildComponentView(view, buildCtx);
      }
      if (view.emptyMessage) {
        return buildWelcomeView(view, buildCtx);
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
    sheetDescription: container.sheetDescription,
    sheetOpenKey: container.sheetOpenKey,
    sidebarBehavior,
    sidebarGroup: container.sidebarGroup ?? 0,
    sidebarOrder: container.sidebarOrder ?? 0,
    title: buildCtx.t(`viewContainer.${container.id}.title`, container.title),
    views: containerViews,
  };
}

function buildPropertiesView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  const pane = view.buildProperties?.(buildCtx);
  return {
    ...viewChrome(view, buildCtx),
    content: {
      headerToggle: pane?.headerToggle,
      kind: 'properties',
      nodes: pane?.nodes ?? [],
    },
    emptyMessage: view.emptyMessage,
    supportsReorder: false,
  };
}

function buildWelcomeView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    ...viewChrome(view, buildCtx),
    content: {
      kind: 'welcome',
      message: view.emptyMessage ?? '',
    },
    emptyMessage: view.emptyMessage,
    supportsReorder: false,
  };
}

function buildComponentView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    ...viewChrome(view, buildCtx),
    content: {
      componentId: view.componentId ?? view.id,
      kind: 'component',
    },
    emptyMessage: view.emptyMessage,
    supportsReorder: false,
  };
}

function buildEmptyView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  return {
    ...viewChrome(view, buildCtx),
    collapsible: view.collapsible ?? true,
    content: { items: [], kind: 'tree' },
    supportsReorder: false,
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
        // Provider `collapsible` marks nestable containers even when empty.
        hasChildren: treeItem.collapsible ?? childrenResult.length > 0,
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
    ...viewChrome(view, buildCtx),
    collapsible: view.collapsible ?? true,
    content: { items, kind: 'tree' },
    supportsReorder: typeof provider.handleMove === 'function',
    viewHover: view.viewHover ?? 'layer',
  };
}
