import {
  Command,
  CommandPaletteContribution,
  ShellUiServiceId,
  WorkbenchPlugin,
  type CommandPaletteBuilder,
  type ShellUiService,
  type WorkbenchPluginContext,
  type CommandContext,
} from '@openenvx/core';

import {
  LayersTreeProvider,
  PagesTreeProvider,
  WORKBENCH_LAYERS_VIEW_ID,
  WORKBENCH_PAGES_VIEW_ID,
  WorkbenchLayersView,
  WorkbenchPagesView,
  WorkbenchSidebarContainer,
  WorkbenchStatusBarContribution,
} from './workbench-chrome-contributions';

export const DEFAULT_WORKBENCH_CHROME_PLUGIN_ID =
  'openworkbench.default-chrome';

export const WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID =
  'workbench.toggleActivityBar';
export const WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID =
  'workbench.togglePrimarySidebar';
export const WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID =
  'workbench.toggleSecondarySidebar';

function createToggleChromeCommand(
  id: string,
  toggle: (shell: ShellUiService) => void
): Command {
  return new (class extends Command {
    readonly id = id;
    execute(ctx: CommandContext): void {
      if (!ctx.services.has(ShellUiServiceId)) {
        return;
      }
      toggle(ctx.services.get(ShellUiServiceId));
    }
  })();
}

class WorkbenchLayoutPaletteContribution extends CommandPaletteContribution {
  contribute(builder: CommandPaletteBuilder): void {
    builder.category('view', 'View');
    builder
      .item(WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID)
      .label('Toggle Activity Bar')
      .category('view');
    builder
      .item(WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID)
      .label('Toggle Primary Sidebar')
      .category('view');
    builder
      .item(WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID)
      .label('Toggle Secondary Sidebar')
      .category('view');
  }
}

/** Pages + Layers activity sidebar and generic dirty status. */
export class DefaultWorkbenchChromePlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_WORKBENCH_CHROME_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(
      new WorkbenchSidebarContainer(),
      new WorkbenchPagesView(),
      new WorkbenchLayersView(),
      new WorkbenchStatusBarContribution(),
      new WorkbenchLayoutPaletteContribution()
    );
    ctx.register(
      createToggleChromeCommand(
        WORKBENCH_TOGGLE_ACTIVITY_BAR_COMMAND_ID,
        (shell) => shell.toggleActivityBar()
      ),
      createToggleChromeCommand(
        WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
        (shell) => shell.togglePrimarySidebar()
      ),
      createToggleChromeCommand(
        WORKBENCH_TOGGLE_SECONDARY_SIDEBAR_COMMAND_ID,
        (shell) => shell.toggleSecondarySidebar()
      )
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_PAGES_VIEW_ID,
      new PagesTreeProvider()
    );
    ctx.registerTreeDataProvider(
      WORKBENCH_LAYERS_VIEW_ID,
      new LayersTreeProvider()
    );
  }
}
