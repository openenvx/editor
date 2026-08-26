import type { CommandContext } from '../backbone';
import { createContributionBuildContext } from '../backbone';
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
import type { ViewLocationService } from '../workbench/view-location-service';
import type {
  ViewContainerDescriptor,
  ViewDescriptor,
  ViewTreeItem,
} from '../workbench/workbench-state';

function resolveViewEmptyMessage(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): string | undefined {
  if (!view.emptyMessage) {
    return undefined;
  }
  return buildCtx.t(`view.${view.id}.empty`, view.emptyMessage);
}

function viewChrome(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): Pick<
  ViewDescriptor,
  | 'addCommandId'
  | 'addLabel'
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
    ...(view.addCommandId
      ? {
          addCommandId: view.addCommandId,
          addLabel: buildCtx.t(`view.${view.id}.add`, view.addLabel ?? 'Add'),
        }
      : {}),
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
      const provider = viewProviderRegistry.get(view.id);
      if (provider) {
        return buildProviderView(view, provider, ctx, buildCtx);
      }
      if (view.emptyMessage) {
        return buildWelcomeView(view, buildCtx);
      }
      return buildEmptyView(view, buildCtx);
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
    emptyMessage: resolveViewEmptyMessage(view, buildCtx),
    supportsReorder: false,
  };
}

function buildWelcomeView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  const message = resolveViewEmptyMessage(view, buildCtx) ?? '';
  return {
    ...viewChrome(view, buildCtx),
    content: {
      kind: 'welcome',
      message,
    },
    emptyMessage: message || undefined,
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
    emptyMessage: resolveViewEmptyMessage(view, buildCtx),
    supportsReorder: false,
  };
}

function buildEmptyView(
  view: ViewContribution,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  const kind = view.presentation === 'list' ? 'list' : 'tree';
  return {
    ...viewChrome(view, buildCtx),
    collapsible: view.collapsible ?? true,
    content: { items: [], kind },
    supportsReorder: false,
    viewHover: view.viewHover ?? 'layer',
  };
}

function treeItemToViewItem(
  treeItem: ReturnType<TreeDataProvider<unknown>['getTreeItem']>,
  node: unknown,
  depth: number,
  hasChildren: boolean
): ViewTreeItem {
  return {
    actions: treeItem.actions,
    commandId: treeItem.commandId,
    depth,
    description: treeItem.description,
    editLabel: treeItem.editLabel,
    hasChildren,
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
  };
}

function buildProviderView(
  view: ViewContribution,
  provider: TreeDataProvider<unknown>,
  ctx: CommandContext,
  buildCtx: ReturnType<typeof createContributionBuildContext>
): ViewDescriptor {
  const presentation = view.presentation ?? 'tree';
  const items: ViewTreeItem[] = [];

  if (presentation === 'list') {
    const roots = provider.getRootChildren(ctx);
    // ponytail: async providers return empty until a refresh path exists.
    if (!(roots instanceof Promise)) {
      for (const node of roots) {
        const treeItem = provider.getTreeItem(node, ctx);
        items.push(treeItemToViewItem(treeItem, node, 0, false));
      }
    }
    return {
      ...viewChrome(view, buildCtx),
      collapsible: view.collapsible ?? false,
      content: { items, kind: 'list' },
      emptyMessage: resolveViewEmptyMessage(view, buildCtx),
      supportsReorder: typeof provider.handleMove === 'function',
      viewHover: view.viewHover ?? 'none',
    };
  }

  const walk = (nodes: unknown[], depth: number) => {
    for (const node of nodes) {
      const treeItem = provider.getTreeItem(node, ctx);
      const childrenResult = provider.getChildren(node, ctx);
      if (childrenResult instanceof Promise) {
        items.push(treeItemToViewItem(treeItem, node, depth, true));
        continue;
      }
      const hasChildren = treeItem.collapsible ?? childrenResult.length > 0;
      items.push(treeItemToViewItem(treeItem, node, depth, hasChildren));
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
    emptyMessage: resolveViewEmptyMessage(view, buildCtx),
    supportsReorder: typeof provider.handleMove === 'function',
    viewHover: view.viewHover ?? 'layer',
  };
}
