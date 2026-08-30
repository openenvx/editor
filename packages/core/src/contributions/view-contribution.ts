import type { CommandContext, ContributionBuildContext } from '../backbone';
import type { MenuBuilder } from '../builders/menu-builder';
import type { PropertyPaneDescriptor } from '../properties/property-pane-descriptor';
import { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';
import { WorkbenchContributionPoint } from '../workbench-contributions/workbench-contribution-point';

export type SidebarBehavior = 'panel' | 'dropdown' | 'command';

/** Where a view container is shown in the workbench shell. */
export type ViewContainerLocation = 'primary' | 'secondary';

export interface TreeItemAction {
  commandId: string;
  icon: string;
  label: string;
}

export interface TreeItem {
  id: string;
  label: string;
  icon?: string;
  /** Secondary line shown in list presentation. */
  description?: string;
  /** When set, row click executes this command (list presentation). */
  commandId?: string;
  /** Inline row actions (list presentation). */
  actions?: TreeItemAction[];
  /**
   * When true, the row is a container in the tree (chevron + nest-into drops)
   * even if it currently has no children.
   */
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

export interface TreeSelectOptions {
  /** Shift / ⌘ / Ctrl - toggle into or out of the current selection. */
  additive?: boolean;
}

export abstract class TreeDataProvider<TNode> {
  abstract getRootChildren(ctx: CommandContext): TNode[] | Promise<TNode[]>;

  abstract getChildren(
    node: TNode,
    ctx: CommandContext
  ): TNode[] | Promise<TNode[]>;

  abstract getTreeItem(node: TNode, ctx: CommandContext): TreeItem;

  onSelect?(
    node: TNode,
    ctx: CommandContext,
    options?: TreeSelectOptions
  ): void;

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
  /**
   * When set with `sidebarBehavior: 'command'`, workbench hosts a Sheet whose
   * open state is this context key. Mount gallery content via a view
   * `componentId` + `registerViewPanel`.
   */
  sheetOpenKey?: string;
  /** Optional description shown in the command Sheet header. */
  sheetDescription?: string;
  /** Default workbench location. Defaults to `'primary'`. */
  defaultLocation?: ViewContainerLocation;
  /** When falsey after evaluate, the container is omitted from chrome. */
  when?: string;

  contributeMenu?(builder: MenuBuilder, ctx: ContributionBuildContext): void;
}

export abstract class ViewContribution extends WorkbenchContribution {
  readonly contributionPoint = WorkbenchContributionPoint.View;

  abstract readonly id: string;
  abstract readonly containerId: string;
  abstract readonly name: string;
  viewOrder?: number;
  /** Which scene id drives row selection highlight. Default: layer ids. */
  viewSelection?: 'layer' | 'page' | 'none';
  /** Which scene id drives row hover highlight. Default: layer ids. */
  viewHover?: 'layer' | 'page' | 'none';
  /**
   * How a {@link TreeDataProvider} view is rendered. Default: `'tree'`.
   * `'list'` is for flat catalogs (variables, scripts-like panels).
   */
  presentation?: 'tree' | 'list';
  /** Footer add button command (list presentation). */
  addCommandId?: string;
  /** Footer add button label; falls back to i18n when omitted. */
  addLabel?: string;
  collapsible?: boolean;
  initialCollapsed?: boolean;
  /** Optional glyph id for the accordion section header (`WorkbenchIcon`). */
  icon?: string;
  /**
   * Optional labelled group for consecutive views in the same container.
   * When the group string changes between sorted views, the shell renders a
   * heading before the next section.
   */
  group?: string;
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
