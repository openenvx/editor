import type { EditorDiagnosticsService } from './diagnostics/editor-diagnostics-service';
import type { LayerRegistry } from './registries/registries';
import { createServiceId } from './runtime/create-service-id';
import type { ContextKeyService } from './workbench/context-key-service';

export { FontServiceId } from './services/font-service-id';
export const LayerRegistryServiceId = createServiceId<LayerRegistry>('layers');
export const ContextKeyServiceId =
  createServiceId<ContextKeyService>('contextKeyService');
export const EditorDiagnosticsServiceId =
  createServiceId<EditorDiagnosticsService>('editorDiagnostics');
