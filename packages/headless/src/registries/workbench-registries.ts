import type { CommandPaletteContribution } from '../contributions/command-palette-contribution';
import type { ContextMenuContribution } from '../contributions/context-menu-contribution';
import type { OverlayContribution } from '../contributions/overlay-contribution';
import type { PropertyPaneContribution } from '../contributions/property-pane-contribution';
import type { StatusBarContribution } from '../contributions/status-bar-contribution';
import type { ToolbarContribution } from '../contributions/toolbar-contribution';
import type {
  ViewContainerContribution,
  ViewContribution,
} from '../contributions/view-contribution';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';

export interface WorkbenchContributionDisposable {
  dispose(): void;
}

export class WorkbenchRegistries {
  readonly viewContainers: ViewContainerContribution[] = [];
  readonly views: ViewContribution[] = [];
  readonly contextMenus: ContextMenuContribution[] = [];
  readonly commandPalette: CommandPaletteContribution[] = [];
  readonly overlays: OverlayContribution[] = [];
  readonly statusBars: StatusBarContribution[] = [];
  readonly toolbars: ToolbarContribution[] = [];
  readonly propertyPanes: PropertyPaneContribution[] = [];
}

function contributionList(
  registries: WorkbenchRegistries,
  point: WorkbenchContribution['contributionPoint']
): WorkbenchContribution[] {
  switch (point) {
    case 'viewContainer': {
      return registries.viewContainers;
    }
    case 'view': {
      return registries.views;
    }
    case 'contextMenu': {
      return registries.contextMenus;
    }
    case 'commandPalette': {
      return registries.commandPalette;
    }
    case 'overlay': {
      return registries.overlays;
    }
    case 'statusBar': {
      return registries.statusBars;
    }
    case 'toolbar': {
      return registries.toolbars;
    }
    case 'propertyPane': {
      return registries.propertyPanes;
    }
    default: {
      const exhaustive: never = point;
      throw new Error(`Unknown workbench contribution point: ${exhaustive}`);
    }
  }
}

function removeContribution(
  list: WorkbenchContribution[],
  contribution: WorkbenchContribution
): void {
  const index = list.indexOf(contribution);
  if (index !== -1) {
    list.splice(index, 1);
  }
}

export function registerWorkbenchContribution(
  registries: WorkbenchRegistries,
  contribution: WorkbenchContribution
): WorkbenchContributionDisposable {
  const list = contributionList(registries, contribution.contributionPoint);
  list.push(contribution);

  return {
    dispose: () => {
      removeContribution(list, contribution);
    },
  };
}
