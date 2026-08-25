import { SimpleServiceContribution, WorkbenchPlugin } from '@openenvx/core';
import type { WorkbenchPluginContext } from '@openenvx/core';
import {
  createBlockCommands,
  createHtmlLayerDefinition,
  registerHtmlPreviewChrome,
} from '@openenvx/html';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';
import { allEmailBlocks } from '../blocks/all-email-blocks';
import { OpenEmailBlocksSheetCommand } from '../commands/open-blocks-sheet-command';
import { OpenEmailTemplatesSheetCommand } from '../commands/open-templates-sheet-command';
import {
  EmailElementsContainer,
  EmailElementsView,
  EMAIL_ELEMENTS_PANEL_COMPONENT_ID,
} from '../contributions/email-blocks-sidebar';
import {
  createEmailChromeCommands,
  createEmailGoBackCommand,
} from '../contributions/email-chrome-commands';
import { EmailContextMenu } from '../contributions/email-context-menu';
import {
  EmailPatternsContainer,
  EmailPatternsView,
  EMAIL_PATTERNS_PANEL_COMPONENT_ID,
} from '../contributions/email-patterns-sidebar';
import {
  EmailTemplatesContainer,
  EmailTemplatesView,
  EMAIL_TEMPLATES_PANEL_COMPONENT_ID,
} from '../contributions/email-templates-sidebar';
import {
  EmailTopBarContribution,
  EMAIL_TOP_BAR_ID,
} from '../contributions/email-top-bar-contribution';
import { EmailBlockPalettePanel } from '../editor/block-palette-panel';
import {
  createEmailModeCommands,
  EmailEditorModeServiceId,
  EmailEditorModeServiceImpl,
} from '../editor/email-editor-mode-service';
import { EmailEditorPane } from '../editor/email-editor-pane';
import { EmailTopBar } from '../editor/email-top-bar';
import { EmailPatternBlocksGallery } from '../editor/pattern-blocks-gallery';
import { EmailTemplatesGallery } from '../editor/templates-gallery';

export interface EmailBlocksPluginOptions {
  /**
   * Register the product top bar (`EmailTopBarContribution`).
   * Off by default — hosts that want it also set `layout.topBar: true`.
   */
  topBar?: boolean;
  /** When set and `topBar` is true, the top bar shows a back control. */
  onBack?: () => void;
}

export class EmailBlocksPlugin extends WorkbenchPlugin {
  readonly id = 'OpenEnvx.email-blocks';

  constructor(private readonly options: EmailBlocksPluginOptions = {}) {
    super();
  }

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    for (const block of allEmailBlocks) {
      emailBlockRegistry.register(block);
    }

    ctx.register(
      new SimpleServiceContribution(
        EmailBlockRegistryServiceId,
        () => emailBlockRegistry
      ),
      new SimpleServiceContribution(
        EmailEditorModeServiceId,
        () => new EmailEditorModeServiceImpl()
      ),
      new OpenEmailBlocksSheetCommand(),
      new OpenEmailTemplatesSheetCommand(),
      ...allEmailBlocks.map((block) =>
        createHtmlLayerDefinition(block, {
          registryServiceId: EmailBlockRegistryServiceId,
        })
      ),
      ...createBlockCommands({
        prefix: 'email',
        rootType: 'email.root',
        registryServiceId: EmailBlockRegistryServiceId,
        typePrefix: 'email.',
        pageLayout: 'email',
      }),
      ...createEmailModeCommands(),
      ...createEmailChromeCommands(),
      ...(this.options.topBar && this.options.onBack
        ? [createEmailGoBackCommand(this.options.onBack)]
        : [])
    );
    registerHtmlPreviewChrome(ctx, { hideFluidPreset: true });

    ctx.registerWorkbench(
      new EmailContextMenu(),
      new EmailTemplatesContainer(),
      new EmailTemplatesView(),
      new EmailPatternsContainer(),
      new EmailPatternsView(),
      new EmailElementsContainer(),
      new EmailElementsView(),
      ...(this.options.topBar ? [new EmailTopBarContribution()] : [])
    );
    ctx.registerViewPanel(
      EMAIL_ELEMENTS_PANEL_COMPONENT_ID,
      EmailBlockPalettePanel
    );
    ctx.registerViewPanel(
      EMAIL_PATTERNS_PANEL_COMPONENT_ID,
      EmailPatternBlocksGallery
    );
    ctx.registerViewPanel(
      EMAIL_TEMPLATES_PANEL_COMPONENT_ID,
      EmailTemplatesGallery
    );
    ctx.registerEditorPane('email', EmailEditorPane);
    if (this.options.topBar) {
      ctx.registerTopBar(EMAIL_TOP_BAR_ID, EmailTopBar);
    }
  }
}
