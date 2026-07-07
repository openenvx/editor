import type { LayerRegistry } from './registries/registries';
import { createServiceId } from './runtime/create-service-id';
import type { SceneStore } from './scene/scene-store';
import type { AssetService, PersistenceService } from './services/types';
import type { ContextKeyService } from './workbench/context-key-service';
import type { EditorService } from './workbench/editor-service';

export const AssetServiceId = createServiceId<AssetService>('assets');
export const PersistenceServiceId =
  createServiceId<PersistenceService>('persistence');
export const LayerRegistryServiceId = createServiceId<LayerRegistry>('layers');
export const SceneStoreServiceId = createServiceId<SceneStore>('sceneStore');
export const EditorServiceId = createServiceId<EditorService>('editorService');
export const ContextKeyServiceId =
  createServiceId<ContextKeyService>('contextKeyService');
