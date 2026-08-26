import {
  WORKBENCH_CONFIRM_DIALOG_ID,
  WorkbenchPlugin,
  type WorkbenchPluginContext,
} from '@openenvx/core';

import { ConfirmWorkbenchDialog } from '../dialogs/confirm-workbench-dialog';

export const DEFAULT_DIALOGS_PLUGIN_ID = 'openworkbench.default-dialogs';

export class DefaultDialogsPlugin extends WorkbenchPlugin {
  readonly id = DEFAULT_DIALOGS_PLUGIN_ID;

  activateWorkbench(ctx: WorkbenchPluginContext): void {
    ctx.registerDialog(WORKBENCH_CONFIRM_DIALOG_ID, ConfirmWorkbenchDialog);
  }
}
