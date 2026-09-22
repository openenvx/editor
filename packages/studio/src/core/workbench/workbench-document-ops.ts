import type { ServiceId } from '../runtime/create-service-id';
import { walkLayers } from '../scene/layer-tree';
import type { SceneStore } from '../scene/scene-store';
import { DocumentValidationError } from '../scene/scene-validation-error';
import type { Document } from '../scene/types';
import {
  normalizeDocument,
  normalizeProjectSnapshot,
  validateDocument,
} from '../schema';
import type { DocumentAsset, ProjectSnapshot } from '../schema/types';
import type { AssetService } from '../services/types';
import { AssetServiceId, PersistenceServiceId } from '../tokens';
import type { EditorInput, EditorService } from '../workbench/editor-service';

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

export function sceneHasUploadingLayers(document: Document): boolean {
  for (const artboard of document.artboards) {
    let found = false;
    walkLayers(artboard.nodes, (layer) => {
      if (layerIsUploading(layer.props)) {
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
  while (sceneHasUploadingLayers(sceneStore.getDocument())) {
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
  assets: Record<string, DocumentAsset> | undefined
): void {
  const assetService = deps.getService(AssetServiceId);
  assetService?.hydrate?.(assets);
}

function exportDocumentAssets(
  document: Document,
  assets: AssetService | null
): Document {
  if (!assets?.exportReferenced) {
    return document;
  }
  const referenced = assets.exportReferenced(document);
  if (Object.keys(referenced).length === 0) {
    return document;
  }
  return {
    ...document,
    assets: referenced,
  };
}

function toPersistedSnapshot(
  deps: DocumentOpsDeps,
  document: Document
): ProjectSnapshot {
  return {
    session: deps.sceneStore.getSession(),
    document: exportDocumentAssets(
      document,
      deps.getService(AssetServiceId) ?? null
    ),
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
    const scene = exportDocumentAssets(input.scene, assets ?? null);
    return effectiveSaveFn({ ...input, scene });
  };
  await deps.editorService.save(
    wrappedSaveFn,
    deps.sceneStore.getContentRevision(),
    deps.sceneStore.getSession()
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
    deps.sceneStore.getSession()
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
  const snapshot = normalizeProjectSnapshot(loaded);
  hydrateAssets(deps, snapshot.document.assets);
  deps.sceneStore.restoreSnapshot({
    contentRevision: 0,
    session: snapshot.session,
    document: snapshot.document,
  });
  deps.editorService.open(
    {
      isDirty: false,
      scene: deps.sceneStore.getDocument(),
      title: uri,
      uri,
    },
    deps.sceneStore.getContentRevision(),
    deps.sceneStore.getSession()
  );
}

export function revertDocument(deps: DocumentOpsDeps): void {
  const reverted = deps.editorService.revert();
  if (reverted) {
    hydrateAssets(deps, reverted.scene.assets);
    deps.sceneStore.restoreSnapshot({
      contentRevision: deps.editorService.getSavedContentRevision() ?? 0,
      session: reverted.editorState ?? deps.sceneStore.getSession(),
      document: reverted.scene,
    });
  }
}

export function loadScene(deps: DocumentOpsDeps, document: Document): void {
  const validation = validateDocument(document);
  if (!validation.valid) {
    throw new DocumentValidationError(
      validation.errors.map((e) =>
        e.path ? `${e.path}: ${e.message}` : e.message
      )
    );
  }
  const normalized = normalizeDocument(document);
  hydrateAssets(deps, normalized.assets);
  deps.sceneStore.replaceDocument(normalized);
}
