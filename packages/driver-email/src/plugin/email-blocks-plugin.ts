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
  EmailBlocksContainer,
  EmailBlocksView,
  EMAIL_BLOCKS_PANEL_COMPONENT_ID,
} from '../contributions/email-blocks-sidebar';
import { EmailContextMenu } from '../contributions/email-context-menu';
import { EmailBlockPalettePanel } from '../editor/block-palette-panel';
import { EmailEditorPane } from '../editor/email-editor-pane';

export class EmailBlocksPlugin extends WorkbenchPlugin {
  readonly id = 'OpenEnvx.email-blocks';

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    for (const block of builtinEmailBlocks) {
      emailBlockRegistry.register(block);
    }

    ctx.register(
      new SimpleServiceContribution(
        EmailBlockRegistryServiceId,
        () => emailBlockRegistry
      ),
      ...builtinEmailBlocks.map((block) =>
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
      new EmailBlocksContainer(),
      new EmailBlocksView()
    );
    ctx.registerViewPanel(
      EMAIL_BLOCKS_PANEL_COMPONENT_ID,
      EmailBlockPalettePanel
    );
    ctx.registerEditorPane('email', EmailEditorPane);
  }
}
