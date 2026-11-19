import {
  Command,
  CommandPaletteContribution,
  ShellUiServiceId,
  WorkbenchPlugin,
  type CommandPaletteBuilder,
  type CommandContext,
  type PluginContext,
  type ShellUiService,
  type WorkbenchPluginContext,
} from '#studio';

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

/** Layout chrome toggles only — pages/layers live in `@openenvx/editor`. */
export class DefaultWorkbenchChromePlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_WORKBENCH_CHROME_PLUGIN_ID;

  override activate(ctx: PluginContext): void {
    this.activateWorkbench(ctx as WorkbenchPluginContext);
  }

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerWorkbench(new WorkbenchLayoutPaletteContribution());
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
  }
}
