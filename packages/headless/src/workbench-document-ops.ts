import { AssetServiceId, PersistenceServiceId } from '@openenvx/core';
import type {
  AssetService,
  EditorInput,
  Scene,
  EditorService,
  SceneStore,
  ServiceId,
} from '@openenvx/core';
import type { SceneAsset } from '@openenvx/schema';
import { normalizeScene } from '@openenvx/schema';

export interface DocumentOpsDeps {
  sceneStore: SceneStore;
  editorService: EditorService;
  getService: <T>(token: ServiceId<T>) => T | undefined;
}

function hydrateAssets(
  deps: DocumentOpsDeps,
  assets: Record<string, SceneAsset> | undefined
): void {
  const assetService = deps.getService(AssetServiceId);
  assetService?.hydrate?.(assets);
}

function exportSceneAssets(scene: Scene, assets: AssetService | null): Scene {
  if (!assets?.exportReferenced) {
    return scene;
  }
  const referenced = assets.exportReferenced(scene);
  if (Object.keys(referenced).length === 0) {
    return scene;
  }
  return {
    ...scene,
    assets: referenced,
  };
}

export async function saveDocument(
  deps: DocumentOpsDeps,
  saveFn?: (input: EditorInput) => Promise<void>
): Promise<void> {
  const editor = deps.editorService.getActiveEditor();
  if (!editor) {
    return;
  }
  const persistence = deps.getService(PersistenceServiceId);
  const assets = deps.getService(AssetServiceId);
  const effectiveSaveFn: (input: EditorInput) => Promise<void> =
    saveFn ??
    (persistence
      ? (input) => persistence.save(input.uri, input.scene)
      : () => Promise.resolve());
  const wrappedSaveFn = (input: EditorInput): Promise<void> => {
    const scene = exportSceneAssets(input.scene, assets ?? null);
    return effectiveSaveFn({ ...input, scene });
  };
  await deps.editorService.save(
    wrappedSaveFn,
    deps.sceneStore.getContentRevision()
  );
}

export async function saveDocumentAs(
  deps: DocumentOpsDeps,
  uri: string
): Promise<void> {
  const editor = deps.editorService.getActiveEditor();
  if (!editor) {
    return;
  }
  const persistence = deps.getService(PersistenceServiceId);
  deps.editorService.open(
    {
      ...editor,
      isDirty: true,
      uri,
      title: uri,
    },
    deps.sceneStore.getContentRevision()
  );
  await saveDocument(
    deps,
    persistence ? (input) => persistence.save(uri, input.scene) : undefined
  );
}

export async function openDocument(
  deps: DocumentOpsDeps,
  uri: string
): Promise<void> {
  const persistence = deps.getService(PersistenceServiceId);
  if (!persistence) {
    return;
  }
  const scene = await persistence.load(uri);
  const normalized = normalizeScene(scene);
  hydrateAssets(deps, normalized.assets);
  deps.sceneStore.setScene(normalized);
  deps.editorService.open(
    {
      isDirty: false,
      scene: deps.sceneStore.getScene(),
      title: uri,
      uri,
    },
    deps.sceneStore.getContentRevision()
  );
}

export function revertDocument(deps: DocumentOpsDeps): void {
  const scene = deps.editorService.revert();
  if (scene) {
    hydrateAssets(deps, scene.assets);
    deps.sceneStore.restoreScene(
      scene,
      deps.editorService.getSavedContentRevision() ?? 0
    );
  }
}

export function loadScene(deps: DocumentOpsDeps, scene: Scene): void {
  const normalized = normalizeScene(scene);
  hydrateAssets(deps, normalized.assets);
  deps.sceneStore.setScene(normalized);
}
