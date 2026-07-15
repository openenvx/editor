import type { EditorRuntime, Registries } from '@openenvx/core';
import {
  DocumentOperationsServiceId,
  LayerRegistryServiceId,
} from '@openenvx/core';

import { ShellUiServiceImpl } from './workbench/shell-ui-service';
import { ShellUiServiceId } from './workbench/shell-ui-service-id';

export interface WorkbenchServiceDeps {
  openDocument: (uri: string) => Promise<void>;
  save: () => Promise<void>;
  saveAs: (uri: string) => Promise<void>;
}

export function bootstrapWorkbenchServices(
  runtime: EditorRuntime,
  coreRegistries: Registries,
  deps: WorkbenchServiceDeps
): void {
  runtime.services.registerInstance(
    LayerRegistryServiceId,
    coreRegistries.layers
  );
  runtime.services.registerInstance(DocumentOperationsServiceId, {
    openDocument: deps.openDocument,
    save: deps.save,
    saveAs: deps.saveAs,
  });
  runtime.services.registerInstance(ShellUiServiceId, new ShellUiServiceImpl());
}
