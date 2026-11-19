import { createServiceId } from '@openenvx/studio';

import type { DocumentStore } from './scene/document-store';
import type { AssetService, PersistenceService } from './services/types';
import type { DocumentHostService } from './workbench/document-host-service';
import type { DocumentOperationsService } from './workbench/document-operations-service';
import type { EditorService } from './workbench/editor-service';

export const AssetServiceId = createServiceId<AssetService>('assets');
export const PersistenceServiceId =
  createServiceId<PersistenceService>('persistence');
export const DocumentStoreServiceId =
  createServiceId<DocumentStore>('documentStore');
export const EditorServiceId = createServiceId<EditorService>('editorService');
export const DocumentHostServiceId =
  createServiceId<DocumentHostService>('documentHost');
export const DocumentOperationsServiceId =
  createServiceId<DocumentOperationsService>('documentOperations');
