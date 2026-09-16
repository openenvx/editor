import type { EditorRuntime } from '../core/editor-runtime';
import type { Registries } from '../registries/registries';
import { LayerRegistryServiceId } from '../tokens';
import { DocumentOperationsServiceId } from './document-operations-service-id';
import { ShellUiServiceImpl } from './shell-ui-service';
import { ShellUiServiceId } from './shell-ui-service-id';

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
