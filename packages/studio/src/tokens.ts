import type { EditorDiagnosticsService } from './diagnostics/editor-diagnostics-service';
import type { LayerRegistry } from './registries/registries';
import { createServiceId } from './runtime/create-service-id';
import type { DocumentStore } from './scene/document-store';
import type {
  AssetService,
  FontService,
  PersistenceService,
} from './services/types';
import type { ContextKeyService } from './workbench/context-key-service';
import type { EditorService } from './workbench/editor-service';

export const AssetServiceId = createServiceId<AssetService>('assets');
export const FontServiceId = createServiceId<FontService>('fonts');
export const PersistenceServiceId =
  createServiceId<PersistenceService>('persistence');
export const LayerRegistryServiceId = createServiceId<LayerRegistry>('layers');
export const DocumentStoreServiceId =
  createServiceId<DocumentStore>('documentStore');
export const EditorServiceId = createServiceId<EditorService>('editorService');
export const ContextKeyServiceId =
  createServiceId<ContextKeyService>('contextKeyService');
export const EditorDiagnosticsServiceId =
  createServiceId<EditorDiagnosticsService>('editorDiagnostics');
