import { normalizeScene, validateScene } from '@openenvx/schema';

import { Emitter } from '../runtime/emitter';
import type { Event } from '../runtime/emitter';
import { HistoryStack } from './history-stack';
import { layerExistsOnPage } from './layer-tree';
import { SceneValidationError } from './scene-validation-error';
import { cloneScene, getActivePage } from './types';
import type {
  Scene,
  SceneSnapshot,
  SceneTransaction,
  Selection,
} from './types';

export class SceneStore {
  private scene: Scene;
  private readonly history = new HistoryStack();
  private readonly onDidChangeSceneEmitter = new Emitter<SceneSnapshot>();
  private revision = 0;
  private contentRevision = 0;

  readonly onDidChangeScene: Event<SceneSnapshot> =
    this.onDidChangeSceneEmitter.event;

  constructor(initial?: Scene) {
    this.scene = normalizeScene(initial ?? {});
  }

  getScene(): Readonly<Scene> {
    return this.scene;
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
      scene: cloneScene(this.scene),
    };
  }

  getSelection(): Selection {
    return { ...this.scene.selection };
  }

  setScene(scene: Scene): void {
    const normalized = normalizeScene(scene);
    const validation = validateScene(normalized);
    if (!validation.valid) {
      throw new SceneValidationError(validation.errors);
    }
    this.scene = normalized;
    this.bumpContentRevision();
    this.notify();
  }

  restoreScene(scene: Scene, contentRevision: number): void {
    const normalized = normalizeScene(scene);
    const validation = validateScene(normalized);
    if (!validation.valid) {
      throw new SceneValidationError(validation.errors);
    }
    this.scene = normalized;
    this.contentRevision = contentRevision;
    this.bumpRevision();
    this.notify();
  }

  setSelection(selection: Selection): void {
    this.scene = {
      ...this.scene,
      selection: { ...selection },
    };
    this.bumpRevision();
    this.notify();
  }

  selectLayers(layerIds: string[], primaryLayerId?: string | null): void {
    const page = getActivePage(this.scene);
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

  apply(transaction: SceneTransaction): void {
    const snapshot = this.getSnapshot();
    this.history.push(snapshot);
    this.scene = normalizeScene(transaction.apply(cloneScene(this.scene)));
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
