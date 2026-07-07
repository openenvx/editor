import type { MenuBuilder } from '../builders/menu-builder';
import { Contribution } from '../core/contribution';
import { ContributionPoint } from '../core/contribution-point';
import type { ContributionBuildContext } from '../i18n/localize';
import type { CommandContext } from '../runtime/types';

export type SidebarBehavior = 'panel' | 'dropdown' | 'command';

export interface TreeItem {
  id: string;
  label: string;
  icon?: string;
  collapsible?: boolean;
  locked?: boolean;
  tooltip?: string;
  lockedCommandId?: string;
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

export abstract class ViewContainerContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.ViewContainer;

  abstract readonly id: string;
  abstract readonly title: string;
  icon?: string;
  sidebarBehavior?: SidebarBehavior;
  sidebarOrder?: number;
  sidebarGroup?: number;
  commandId?: string;

  contributeMenu?(builder: MenuBuilder, ctx: ContributionBuildContext): void;
}

export abstract class ViewContribution extends Contribution {
  readonly contributionPoint = ContributionPoint.View;

  abstract readonly id: string;
  abstract readonly containerId: string;
  abstract readonly name: string;
  viewOrder?: number;
  /** Which scene id drives row selection highlight. Default: layer ids. */
  viewSelection?: 'layer' | 'page';
  collapsible?: boolean;
  initialCollapsed?: boolean;

  abstract createProvider(): TreeDataProvider<unknown>;
}
