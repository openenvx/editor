import type { PluginContext } from '@openenvx/core';
import {
  LocalStoragePersistenceService,
  PersistenceServiceId,
  Plugin,
  SimpleServiceContribution,
} from '@openenvx/core';
import type { WorkbenchPluginContext } from '@openenvx/headless';

import {
  CanvasDemoExportStatusBar,
  createCanvasDemoExportCommands,
} from '../contributions/canvas-demo-export';
import { PagePresetFieldRenderer } from '../properties/page-preset-field-renderer';
import {
  CanvasDemoExportServiceId,
  CanvasDemoExportServiceImpl,
} from '../services/canvas-demo-export-service';

function readExportServiceUrl(): string | null {
  if (import.meta.env.VITE_EXPORT_SERVICE === 'false') {
    return null;
  }
  return import.meta.env.VITE_EXPORT_SERVICE_URL ?? '';
}

export class CanvasDemoPlugin extends Plugin {
  readonly id = 'openworkbench.canvas-demo';

  activate(ctx: PluginContext): void {
    ctx.register(
      ...createCanvasDemoExportCommands(),
      new SimpleServiceContribution(
        CanvasDemoExportServiceId,
        () =>
          new CanvasDemoExportServiceImpl({
            exportServiceUrl: readExportServiceUrl(),
          })
      ),
      new SimpleServiceContribution(
        PersistenceServiceId,
        () => new LocalStoragePersistenceService()
      )
    );
    const workbench = ctx as WorkbenchPluginContext;
    workbench.registerFieldRenderer('pagePreset', PagePresetFieldRenderer);
    workbench.registerWorkbench(new CanvasDemoExportStatusBar());
  }
}
