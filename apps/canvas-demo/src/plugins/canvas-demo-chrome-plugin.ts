import {
  BUILT_IN_THEMES,
  SUPPORTED_LOCALES,
  WORKBENCH_SIDEBAR_CONTAINER_ID,
  WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
  registerDefaultWorkbenchBundle,
  workbenchEnBundle,
  workbenchPlBundle,
} from '@openenvx/canvas-studio';
import {
  Command,
  DocumentHostServiceId,
  DocumentOperationsServiceId,
  I18nContribution,
  LocalizationServiceId,
  MenuChoiceRegistryId,
  Plugin,
  ShortcutContribution,
  ThemeServiceId,
} from '@openenvx/core';
import type {
  CommandContext,
  ContributionBuildContext,
  I18nBundleRegistry,
  LocalizationService,
  MenuChoiceProvider,
  PluginContext,
  ThemeService,
} from '@openenvx/core';
import {
  CommandPaletteContribution,
  ShellUiServiceId,
  SidebarHeaderContribution,
  createMenuBuilder,
  isCommandMenuItem,
  type CommandPaletteBuilder,
  type MenuBuilder,
  type SidebarHeaderBuilder,
  type WorkbenchPluginContext,
} from '@openenvx/headless';

import {
  CANVAS_DEMO_EXPORT_FORMATS,
  canvasDemoExportCommandId,
} from '../contributions/canvas-demo-export';

export const WORKBENCH_SAVE_COMMAND_ID = 'workbench.save';
export const WORKBENCH_SAVE_AS_COMMAND_ID = 'workbench.saveAs';
export const WORKBENCH_OPEN_COMMAND_ID = 'workbench.open';
export const WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID =
  'workbench.commandPalette.toggle';
export const WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID = 'workbench.theme';
export const WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID = 'workbench.locale';

function getDocumentHost(ctx: CommandContext) {
  if (!ctx.services.has(DocumentHostServiceId)) {
    return null;
  }
  return ctx.services.get(DocumentHostServiceId);
}

function getDocumentOperations(ctx: CommandContext) {
  if (!ctx.services.has(DocumentOperationsServiceId)) {
    return null;
  }
  return ctx.services.get(DocumentOperationsServiceId);
}

function createLocaleMenuChoiceProvider(
  localization: LocalizationService,
  locales: readonly string[]
): MenuChoiceProvider {
  return {
    id: WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID,
    getValue: () => localization.locale,
    setValue: (value) => localization.setLocale(value),
    getChoices: () =>
      locales.map((locale) => ({
        value: locale,
        label: localization.t(`workbench.locale.${locale}`, {
          defaultValue: locale,
        }),
      })),
    onDidChangeValue: localization.onDidChangeLocale,
  };
}

function createThemeMenuChoiceProvider(
  themeService: ThemeService,
  localization: LocalizationService,
  themes: readonly string[]
): MenuChoiceProvider {
  return {
    id: WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID,
    getValue: () => themeService.theme,
    setValue: (value) => themeService.setTheme(value),
    getChoices: () =>
      themes.map((themeName) => ({
        value: themeName,
        label: localization.t(`workbench.theme.${themeName}`, {
          defaultValue: themeName,
        }),
      })),
    onDidChangeValue: themeService.onDidChangeTheme,
  };
}

class WorkbenchSaveCommand extends Command {
  readonly id = WORKBENCH_SAVE_COMMAND_ID;

  async execute(ctx: CommandContext): Promise<void> {
    await getDocumentOperations(ctx)?.save();
  }
}

class WorkbenchSaveAsCommand extends Command {
  readonly id = WORKBENCH_SAVE_AS_COMMAND_ID;

  canExecute(ctx: CommandContext): boolean {
    return getDocumentHost(ctx)?.canPromptSaveAs() ?? false;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const host = getDocumentHost(ctx);
    const operations = getDocumentOperations(ctx);
    if (!host || !operations) {
      return;
    }
    const uri = await host.promptSaveAs();
    if (uri) {
      await operations.saveAs(uri);
    }
  }
}

class WorkbenchOpenCommand extends Command {
  readonly id = WORKBENCH_OPEN_COMMAND_ID;

  canExecute(ctx: CommandContext): boolean {
    return getDocumentHost(ctx)?.canPromptOpen() ?? false;
  }

  async execute(ctx: CommandContext): Promise<void> {
    const host = getDocumentHost(ctx);
    const operations = getDocumentOperations(ctx);
    if (!host || !operations) {
      return;
    }
    const uri = await host.promptOpen();
    if (uri) {
      await operations.openDocument(uri);
    }
  }
}

class ToggleCommandPaletteCommand extends Command {
  readonly id = WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID;

  execute(ctx: CommandContext): void {
    if (!ctx.services.has(ShellUiServiceId)) {
      return;
    }
    ctx.services.get(ShellUiServiceId).toggleCommandPalette();
  }
}

function contributeFileMenu(
  builder: MenuBuilder,
  ctx: ContributionBuildContext
): void {
  builder
    .radioGroup(
      'theme',
      WORKBENCH_THEME_MENU_CHOICE_PROVIDER_ID,
      ctx.t('workbench.file.theme', 'Theme')
    )
    .radioGroup(
      'language',
      WORKBENCH_LOCALE_MENU_CHOICE_PROVIDER_ID,
      ctx.t('workbench.file.language', 'Language')
    )
    .separator('file-separator');
  builder
    .item(WORKBENCH_SAVE_COMMAND_ID)
    .label(ctx.t('workbench.file.save', 'Save'))
    .shortcut('Mod+S');
  builder
    .item(WORKBENCH_SAVE_AS_COMMAND_ID)
    .label(ctx.t('workbench.file.saveAs', 'Save As…'));
  builder
    .item(WORKBENCH_OPEN_COMMAND_ID)
    .label(ctx.t('workbench.file.open', 'Open…'));

  const exportMenu = createMenuBuilder();
  for (const format of CANVAS_DEMO_EXPORT_FORMATS) {
    exportMenu
      .item(canvasDemoExportCommandId(format))
      .label(ctx.t(`workbench.export.${format}`, format.toUpperCase()));
  }
  exportMenu
    .item('canvas.exportImage')
    .label(ctx.t('workbench.export.image', 'Image'));

  const exportItems = exportMenu
    .build()
    .filter(
      (item) => !isCommandMenuItem(item) || ctx.canExecute(item.commandId)
    );

  if (exportItems.length > 0) {
    builder.submenu(
      'workbench.export',
      ctx.t('workbench.file.export', 'Export'),
      (menu) => {
        for (const item of exportItems) {
          if (isCommandMenuItem(item)) {
            const next = menu.item(item.commandId);
            if (item.label) {
              next.label(item.label);
            }
            if (item.shortcut) {
              next.shortcut(item.shortcut);
            }
          }
        }
      }
    );
  }
}

/** Document title + file menu + save / hide — Pages/Layers panel only. */
class PrimarySidebarHeader extends SidebarHeaderContribution {
  readonly containerId = WORKBENCH_SIDEBAR_CONTAINER_ID;

  contribute(
    builder: SidebarHeaderBuilder,
    ctx: ContributionBuildContext
  ): void {
    builder
      .titleBinding('editorTitle')
      .titleMenu((menu) => {
        contributeFileMenu(menu, ctx);
      })
      .action('save', {
        commandId: WORKBENCH_SAVE_COMMAND_ID,
        icon: 'cloudCheck',
        label: ctx.t('workbench.file.save', 'Save'),
        priority: 10,
      })
      .action('hidePanels', {
        commandId: WORKBENCH_TOGGLE_PRIMARY_SIDEBAR_COMMAND_ID,
        icon: 'panelLeft',
        label: ctx.t('workbench.header.hidePanels', 'Hide panels'),
        priority: 20,
      })
      .showMoveMenu(false);
  }
}

class WorkbenchCommandPaletteItems extends CommandPaletteContribution {
  contribute(
    builder: CommandPaletteBuilder,
    ctx: ContributionBuildContext
  ): void {
    builder.category(
      'file',
      ctx.t('core.commandPalette.category.file', 'File')
    );
    builder.item(WORKBENCH_SAVE_COMMAND_ID).category('file').shortcut('Mod+S');
    builder.item(WORKBENCH_SAVE_AS_COMMAND_ID).category('file');
    builder.item(WORKBENCH_OPEN_COMMAND_ID).category('file');
    builder.item(WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID).hide();
  }
}

class WorkbenchI18nBundle extends I18nContribution {
  readonly sourceId = 'workbench';

  contribute(registry: I18nBundleRegistry): void {
    registry.bundle('en', registerDefaultWorkbenchBundle(workbenchEnBundle));
    registry.bundle('pl', registerDefaultWorkbenchBundle(workbenchPlBundle));
  }
}

class ToggleCommandPaletteShortcut extends ShortcutContribution {
  readonly keybinding = 'Mod+/';
  readonly commandId = WORKBENCH_TOGGLE_COMMAND_PALETTE_COMMAND_ID;
}

export class CanvasDemoChromePlugin extends Plugin {
  readonly id = 'openworkbench.canvas-demo.chrome';

  activate(ctx: PluginContext): void {
    const registry = ctx.services.get(MenuChoiceRegistryId);
    const localization = ctx.services.get(LocalizationServiceId);
    const themeService = ctx.services.get(ThemeServiceId);

    registry.register(
      createLocaleMenuChoiceProvider(localization, SUPPORTED_LOCALES)
    );
    registry.register(
      createThemeMenuChoiceProvider(themeService, localization, BUILT_IN_THEMES)
    );

    ctx.register(
      new WorkbenchI18nBundle(),
      new WorkbenchSaveCommand(),
      new WorkbenchSaveAsCommand(),
      new WorkbenchOpenCommand(),
      new ToggleCommandPaletteCommand(),
      new ToggleCommandPaletteShortcut()
    );
    (ctx as WorkbenchPluginContext).registerWorkbench(
      new PrimarySidebarHeader(),
      new WorkbenchCommandPaletteItems()
    );
  }
}
