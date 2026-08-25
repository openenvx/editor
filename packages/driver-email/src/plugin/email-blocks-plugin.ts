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
import { EmailToolbarContribution } from '../contributions/email-toolbar-contribution';
import { EmailBlockPalettePanel } from '../editor/block-palette-panel';
import {
  createEmailModeCommands,
  EmailEditorModeServiceId,
  EmailEditorModeServiceImpl,
} from '../editor/email-editor-mode-service';
import { EmailEditorPane } from '../editor/email-editor-pane';
import { EmailPatternBlocksGallery } from '../editor/pattern-blocks-gallery';
import { EmailTemplatesGallery } from '../editor/templates-gallery';

export class EmailBlocksPlugin extends WorkbenchPlugin {
  readonly id = 'OpenEnvx.email-blocks';

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
      ...createEmailModeCommands()
    );
    registerHtmlPreviewChrome(ctx);

    ctx.registerWorkbench(
      new EmailContextMenu(),
      new EmailTemplatesContainer(),
      new EmailTemplatesView(),
      new EmailPatternsContainer(),
      new EmailPatternsView(),
      new EmailElementsContainer(),
      new EmailElementsView(),
      new EmailToolbarContribution()
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
  }
}
