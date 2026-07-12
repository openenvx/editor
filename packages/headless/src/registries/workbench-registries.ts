import type { CommandPaletteContribution } from '../contributions/command-palette-contribution';
import type { ContextMenuContribution } from '../contributions/context-menu-contribution';
import type { EditorPaneContribution } from '../contributions/editor-pane-contribution';
import type { FieldRendererContribution } from '../contributions/field-renderer-contribution';
import type { InspectorPaneContribution } from '../contributions/inspector-pane-contribution';
import type { OverlayContribution } from '../contributions/overlay-contribution';
import type { StatusBarContribution } from '../contributions/status-bar-contribution';
import type { StatusBarItemRendererContribution } from '../contributions/status-bar-item-renderer-contribution';
import type { ToolbarContribution } from '../contributions/toolbar-contribution';
import type {
  ViewContainerContribution,
  ViewContribution,
} from '../contributions/view-contribution';
import type { WorkbenchContribution } from '../workbench-contributions/workbench-contribution';

export class WorkbenchRegistries {
  readonly viewContainers: ViewContainerContribution[] = [];
  readonly views: ViewContribution[] = [];
  readonly contextMenus: ContextMenuContribution[] = [];
  readonly commandPalette: CommandPaletteContribution[] = [];
  readonly overlays: OverlayContribution[] = [];
  readonly statusBars: StatusBarContribution[] = [];
  readonly statusBarItemRenderers: StatusBarItemRendererContribution[] = [];
  readonly toolbars: ToolbarContribution[] = [];
  readonly editorPanes: EditorPaneContribution[] = [];
  readonly inspectorPanes: InspectorPaneContribution[] = [];
  readonly fieldRenderers: FieldRendererContribution[] = [];
}

export function registerWorkbenchContribution(
  registries: WorkbenchRegistries,
  contribution: WorkbenchContribution
): void {
  switch (contribution.contributionPoint) {
    case 'viewContainer': {
      registries.viewContainers.push(contribution as ViewContainerContribution);
      break;
    }
    case 'view': {
      registries.views.push(contribution as ViewContribution);
      break;
    }
    case 'contextMenu': {
      registries.contextMenus.push(contribution as ContextMenuContribution);
      break;
    }
    case 'commandPalette': {
      registries.commandPalette.push(
        contribution as CommandPaletteContribution
      );
      break;
    }
    case 'overlay': {
      registries.overlays.push(contribution as OverlayContribution);
      break;
    }
    case 'statusBar': {
      registries.statusBars.push(contribution as StatusBarContribution);
      break;
    }
    case 'statusBarItemRenderer': {
      registries.statusBarItemRenderers.push(
        contribution as StatusBarItemRendererContribution
      );
      break;
    }
    case 'toolbar': {
      registries.toolbars.push(contribution as ToolbarContribution);
      break;
    }
    case 'editorPane': {
      registries.editorPanes.push(contribution as EditorPaneContribution);
      break;
    }
    case 'inspectorPane': {
      registries.inspectorPanes.push(contribution as InspectorPaneContribution);
      break;
    }
    case 'fieldRenderer': {
      registries.fieldRenderers.push(contribution as FieldRendererContribution);
      break;
    }
    default: {
      throw new Error(
        `Unknown workbench contribution point: ${(contribution as WorkbenchContribution).contributionPoint}`
      );
    }
  }
}
