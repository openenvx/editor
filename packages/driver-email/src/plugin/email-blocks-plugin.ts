import { SimpleServiceContribution } from '@openenvx/core';
import { WorkbenchPlugin } from '@openenvx/headless';
import type { WorkbenchPluginContext } from '@openenvx/headless';
import { createBlockCommands, createHtmlLayerDefinition } from '@openenvx/html';

import {
  emailBlockRegistry,
  EmailBlockRegistryServiceId,
} from '../block-registry';
import { builtinEmailBlocks } from '../blocks/builtin-blocks';
import {
  emailPatternBlocks,
  emailPatternPartBlocks,
} from '../blocks/pattern-blocks';
import { OpenEmailBlocksSheetCommand } from '../commands/open-blocks-sheet-command';
import {
  EmailElementsContainer,
  EmailElementsView,
  EMAIL_ELEMENTS_PANEL_COMPONENT_ID,
} from '../contributions/email-blocks-sidebar';
import { EmailContextMenu } from '../contributions/email-context-menu';
import { EmailPatternsContainer } from '../contributions/email-patterns-sidebar';
import { EmailBlockPalettePanel } from '../editor/block-palette-panel';
import { EmailEditorPane } from '../editor/email-editor-pane';

const allEmailBlocks = [
  ...builtinEmailBlocks,
  ...emailPatternPartBlocks,
  ...emailPatternBlocks,
];

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
      new OpenEmailBlocksSheetCommand(),
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
      })
    );

    ctx.registerWorkbench(
      new EmailContextMenu(),
      new EmailPatternsContainer(),
      new EmailElementsContainer(),
      new EmailElementsView()
    );
    ctx.registerViewPanel(
      EMAIL_ELEMENTS_PANEL_COMPONENT_ID,
      EmailBlockPalettePanel
    );
    ctx.registerEditorPane('email', EmailEditorPane);
  }
}
