import {
  createDefaultEditorState,
  normalizeEditorState,
  normalizeScene,
  pruneEditorState,
  validateScene,
} from '@openenvx/schema';
import type { EditorState, Scene, Selection } from '@openenvx/schema';

import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { HistoryStack } from './history-stack';
import { layerExistsOnPage } from './layer-tree';
import { SceneValidationError } from './scene-validation-error';
import {
  cloneEditorState,
  cloneScene,
  getActivePage,
  getPrimaryLayer as getPrimaryPageLayer,
} from './types';
import type { SceneSnapshot, SceneTransaction } from './types';

function formatValidationErrors(
  errors: { path: string; message: string }[]
): string[] {
  return errors.map((e) => (e.path ? `${e.path}: ${e.message}` : e.message));
}

export class SceneStore {
  private scene: Scene;
  private editorState: EditorState;
  private readonly history = new HistoryStack();
  private readonly onDidChangeSceneEmitter = new Emitter<SceneSnapshot>();
  private revision = 0;
  private contentRevision = 0;

  readonly onDidChangeScene: Event<SceneSnapshot> =
    this.onDidChangeSceneEmitter.event;

  constructor(initial?: Scene, initialEditorState?: EditorState) {
    this.scene = normalizeScene(initial ?? {});
    const fallbackPageId = this.scene.pages[0]!.id;
    this.editorState = initialEditorState
      ? normalizeEditorState(initialEditorState, fallbackPageId, this.scene)
      : createDefaultEditorState(fallbackPageId);
    this.syncEditorStateToScene();
  }

  getScene(): Readonly<Scene> {
    return this.scene;
  }

  getEditorState(): Readonly<EditorState> {
    return this.editorState;
  }

  getRevision(): number {
    return this.revision;
  }

  getContentRevision(): number {
    return this.contentRevision;
  }

  getSnapshot(): SceneSnapshot {
    return {
      contentRevision: this.contentRevision,
      editorState: cloneEditorState(this.editorState),
      scene: cloneScene(this.scene),
    };
  }

  getSelection(): Selection {
    return { ...this.editorState };
  }

  getActivePageId(): string {
    return this.editorState.activePageId;
  }

  getActivePage() {
    return getActivePage(this.scene, this.editorState.activePageId);
  }

  getPrimaryLayer() {
    return getPrimaryPageLayer(this.scene, this.editorState);
  }

  setScene(scene: Scene): void {
    const validation = validateScene(scene);
    if (!validation.valid) {
      throw new SceneValidationError(formatValidationErrors(validation.errors));
    }
    this.scene = normalizeScene(scene);
    this.syncEditorStateToScene();
    this.bumpContentRevision();
    this.notify();
  }

  restoreScene(scene: Scene, contentRevision: number): void {
    const validation = validateScene(scene);
    if (!validation.valid) {
      throw new SceneValidationError(formatValidationErrors(validation.errors));
    }
    this.scene = normalizeScene(scene);
    this.syncEditorStateToScene();
    this.contentRevision = contentRevision;
    this.bumpRevision();
    this.notify();
  }

  restoreSnapshot(snapshot: SceneSnapshot): void {
    const validation = validateScene(snapshot.scene);
    if (!validation.valid) {
      throw new SceneValidationError(formatValidationErrors(validation.errors));
    }
    this.scene = normalizeScene(snapshot.scene);
    this.editorState = normalizeEditorState(
      snapshot.editorState,
      this.scene.pages[0]!.id,
      this.scene
    );
    this.contentRevision = snapshot.contentRevision;
    this.bumpRevision();
    this.notify();
  }

  setEditorState(editorState: EditorState): void {
    this.editorState = normalizeEditorState(
      editorState,
      this.scene.pages[0]!.id,
      this.scene
    );
    this.bumpRevision();
    this.notify();
  }

  setSelection(selection: Selection): void {
    this.setEditorState(selection);
  }

  selectLayers(layerIds: string[], primaryLayerId?: string | null): void {
    const page = getActivePage(this.scene, this.editorState.activePageId);
    const valid = layerIds.filter((id) => layerExistsOnPage(page, id));
    const primary =
      primaryLayerId === undefined
        ? (valid[0] ?? null)
        : primaryLayerId && valid.includes(primaryLayerId)
          ? primaryLayerId
          : (valid[0] ?? null);
    this.setSelection({
      activePageId: page.id,
      primaryLayerId: primary,
      selectedLayerIds: valid,
    });
  }

  setActivePage(pageId: string): void {
    if (!this.scene.pages.some((p) => p.id === pageId)) {
      return;
    }
    this.setEditorState({
      activePageId: pageId,
      primaryLayerId: null,
      selectedLayerIds: [],
    });
  }

  apply(transaction: SceneTransaction): void {
    const snapshot = this.getSnapshot();
    // Normalize before history push so invalid transactions leave no side effects.
    const nextScene = normalizeScene(transaction.apply(cloneScene(this.scene)));
    this.history.push(snapshot);
    this.scene = nextScene;
    if (transaction.activePageId) {
      this.editorState = normalizeEditorState(
        {
          activePageId: transaction.activePageId,
          primaryLayerId: null,
          selectedLayerIds: [],
        },
        this.scene.pages[0]!.id,
        this.scene
      );
    } else {
      this.syncEditorStateToScene();
    }
    this.bumpContentRevision();
    this.notify();
  }

  undo(): boolean {
    const current = this.getSnapshot();
    const previous = this.history.undo(current);
    if (!previous) {
      return false;
    }
    this.scene = previous.scene;
    this.editorState = previous.editorState;
    this.contentRevision = previous.contentRevision;
    this.bumpRevision();
    this.notify();
    return true;
  }

  redo(): boolean {
    const current = this.getSnapshot();
    const next = this.history.redo(current);
    if (!next) {
      return false;
    }
    this.scene = next.scene;
    this.editorState = next.editorState;
    this.contentRevision = next.contentRevision;
    this.bumpRevision();
    this.notify();
    return true;
  }

  canUndo(): boolean {
    return this.history.canUndo();
  }

  canRedo(): boolean {
    return this.history.canRedo();
  }

  subscribe(listener: (snapshot: SceneSnapshot) => void): () => void {
    return this.onDidChangeScene(listener).dispose;
  }

  private syncEditorStateToScene(): void {
    this.editorState = pruneEditorState(this.scene, this.editorState);
  }

  private bumpRevision(): void {
    this.revision += 1;
  }

  private bumpContentRevision(): void {
    this.bumpRevision();
    this.contentRevision += 1;
  }

  private notify(): void {
    this.onDidChangeSceneEmitter.fire(this.getSnapshot());
  }
}

export function reorderLayers(
  layers: Scene['pages'][0]['layers'],
  layerId: string,
  direction: 'up' | 'down'
): Scene['pages'][0]['layers'] {
  const index = layers.findIndex((l) => l.id === layerId);
  if (index === -1) {
    return layers;
  }
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  return moveLayerToIndex(layers, layerId, targetIndex);
}

export function moveLayerToIndex(
  layers: Scene['pages'][0]['layers'],
  layerId: string,
  targetIndex: number
): Scene['pages'][0]['layers'] {
  const fromIndex = layers.findIndex((l) => l.id === layerId);
  if (fromIndex === -1) {
    return layers;
  }
  const clamped = Math.max(0, Math.min(targetIndex, layers.length - 1));
  if (fromIndex === clamped) {
    return layers;
  }
  const result = [...layers];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(clamped, 0, removed!);
  return result;
}
