import type { CommandContext, ContributionBuildContext } from '@openenvx/core';

import type { MenuBuilder } from '../builders/menu-builder';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export type SidebarBehavior = 'panel' | 'dropdown' | 'command';

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
}
