import type { CommandContext, ContributionBuildContext } from '@openenvx/core';

import type { MenuBuilder } from '../builders/menu-builder';
import type { PropertyPaneDescriptor } from '../inspector/property-pane-descriptor';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export type SidebarBehavior = 'panel' | 'dropdown' | 'command';

/** Where a view container is shown in the workbench shell. */
export type ViewContainerLocation = 'primary' | 'secondary';

export interface TreeItem {
  id: string;
  label: string;
  icon?: string;
  collapsible?: boolean;
  locked?: boolean;
  tooltip?: string;
  lockedCommandId?: string;
  /** When false, the row is dimmed (layer hidden). Absent/true = visible. */
  visible?: boolean;
  visibilityCommandId?: string;
  /** When set, a second click on the selected label starts inline rename. */
  renameCommandId?: string;
  /** Raw stored name for the rename input (may be empty). */
  editLabel?: string;
}

export abstract class TreeDataProvider<TNode> {
  abstract getRootChildren(ctx: CommandContext): TNode[] | Promise<TNode[]>;

  abstract getChildren(
    node: TNode,
    ctx: CommandContext
  ): TNode[] | Promise<TNode[]>;

  abstract getTreeItem(node: TNode, ctx: CommandContext): TreeItem;

  onSelect?(node: TNode, ctx: CommandContext): void;

  canMove?(
    source: TNode,
    target: TNode,
    position: 'before' | 'after' | 'inside'
  ): boolean;

  handleMove?(
    source: TNode,
    target: TNode,
    position: 'before' | 'after' | 'inside',
    ctx: CommandContext
  ): void;
}

export abstract class ViewContainerContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.ViewContainer;

  abstract readonly id: string;
  abstract readonly title: string;
  icon?: string;
  sidebarBehavior?: SidebarBehavior;
  sidebarOrder?: number;
  sidebarGroup?: number;
  commandId?: string;
  /** Default workbench location. Defaults to `'primary'`. */
  defaultLocation?: ViewContainerLocation;

  contributeMenu?(builder: MenuBuilder, ctx: ContributionBuildContext): void;
}

export abstract class ViewContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.View;

  abstract readonly id: string;
  abstract readonly containerId: string;
  abstract readonly name: string;
  viewOrder?: number;
  /** Which scene id drives row selection highlight. Default: layer ids. */
  viewSelection?: 'layer' | 'page';
  /** Which scene id drives row hover highlight. Default: layer ids. */
  viewHover?: 'layer' | 'page' | 'none';
  collapsible?: boolean;
  initialCollapsed?: boolean;
  when?: string;
  /**
   * When set, the view renders a registered React panel instead of a tree.
   * Resolve via `registerViewPanel(componentId, Component)`.
   * Only for non-form surfaces (chat, version history). Prefer
   * {@link buildProperties} for settings / property panes.
   */
  componentId?: string;
  /**
   * VS Code–style properties view: declare field rows; workbench renders.
   * Takes precedence over tree providers when implemented.
   */
  buildProperties?(ctx: ContributionBuildContext): PropertyPaneDescriptor;
  /** viewsWelcome analogue when this view has no properties body. */
  emptyMessage?: string;
}
