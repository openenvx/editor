import {
  AssetServiceId,
  PersistenceServiceId,
  SceneValidationError,
  walkLayers,
} from '@openenvx/core';
import type {
  AssetService,
  EditorInput,
  Scene,
  EditorService,
  SceneStore,
  ServiceId,
} from '@openenvx/core';
import type { SceneAsset, SceneSnapshot } from '@xmazu/openenvxee-schema';
import {
  normalizeScene,
  normalizeSceneSnapshot,
  validateScene,
} from '@xmazu/openenvxee-schema';

export interface DocumentOpsDeps {
  sceneStore: SceneStore;
  editorService: EditorService;
  getService: <T>(token: ServiceId<T>) => T | undefined;
}

function layerIsUploading(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { uploading?: unknown }).uploading === true
  );
}

export function sceneHasUploadingLayers(scene: Scene): boolean {
  for (const page of scene.pages) {
    let found = false;
    walkLayers(page.layers, (layer) => {
      if (layerIsUploading(layer.data)) {
        found = true;
      }
    });
    if (found) {
      return true;
    }
  }
  return false;
}

async function waitForUploadingLayers(
  sceneStore: SceneStore,
  timeoutMs = 60_000
): Promise<void> {
  const started = Date.now();
  while (sceneHasUploadingLayers(sceneStore.getScene())) {
    if (Date.now() - started > timeoutMs) {
      throw new Error('Timed out waiting for image uploads to finish');
    }
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });
  }
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

function toPersistedSnapshot(
  deps: DocumentOpsDeps,
  scene: Scene
): SceneSnapshot {
  return {
    editorState: deps.sceneStore.getEditorState(),
    scene: exportSceneAssets(scene, deps.getService(AssetServiceId) ?? null),
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
  await waitForUploadingLayers(deps.sceneStore);
  const persistence = deps.getService(PersistenceServiceId);
  const assets = deps.getService(AssetServiceId);
  const effectiveSaveFn: (input: EditorInput) => Promise<void> =
    saveFn ??
    (persistence
      ? (input) =>
          persistence.save(input.uri, toPersistedSnapshot(deps, input.scene))
      : () => Promise.resolve());
  const wrappedSaveFn = (input: EditorInput): Promise<void> => {
    const scene = exportSceneAssets(input.scene, assets ?? null);
    return effectiveSaveFn({ ...input, scene });
  };
  await deps.editorService.save(
    wrappedSaveFn,
    deps.sceneStore.getContentRevision(),
    deps.sceneStore.getEditorState()
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
    deps.sceneStore.getContentRevision(),
    deps.sceneStore.getEditorState()
  );
  await saveDocument(
    deps,
    persistence
      ? (input) => persistence.save(uri, toPersistedSnapshot(deps, input.scene))
      : undefined
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
  const loaded = await persistence.load(uri);
  const snapshot = normalizeSceneSnapshot(loaded);
  hydrateAssets(deps, snapshot.scene.assets);
  deps.sceneStore.restoreSnapshot({
    contentRevision: 0,
    editorState: snapshot.editorState,
    scene: snapshot.scene,
  });
  deps.editorService.open(
    {
      isDirty: false,
      scene: deps.sceneStore.getScene(),
      title: uri,
      uri,
    },
    deps.sceneStore.getContentRevision(),
    deps.sceneStore.getEditorState()
  );
}

export function revertDocument(deps: DocumentOpsDeps): void {
  const reverted = deps.editorService.revert();
  if (reverted) {
    hydrateAssets(deps, reverted.scene.assets);
    deps.sceneStore.restoreSnapshot({
      contentRevision: deps.editorService.getSavedContentRevision() ?? 0,
      editorState: reverted.editorState ?? deps.sceneStore.getEditorState(),
      scene: reverted.scene,
    });
  }
}

export function loadScene(deps: DocumentOpsDeps, scene: Scene): void {
  const validation = validateScene(scene);
  if (!validation.valid) {
    throw new SceneValidationError(
      validation.errors.map((e) =>
        e.path ? `${e.path}: ${e.message}` : e.message
      )
    );
  }
  const normalized = normalizeScene(scene);
  hydrateAssets(deps, normalized.assets);
  deps.sceneStore.setScene(normalized);
}
