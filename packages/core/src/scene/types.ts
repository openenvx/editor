import type { EditorState, Layer, Scene } from '@xmazu/openenvxee-schema';

import { walkLayers } from './layer-tree';

export type {
  EditorPaneKind,
  EditorState,
  Layer,
  Page,
  PageLayout,
  Scene,
  SceneAsset,
  SceneSnapshot as SchemaSceneSnapshot,
  Selection,
  Transform,
} from '@xmazu/openenvxee-schema';

/**
 * Scene + editor snapshot.
 *
 * - `SceneStore.getSnapshot()` — deep clone (persistence / export).
 * - `onDidChangeScene` / history — **shared** refs; treat as immutable.
 */
export interface SceneSnapshot {
  scene: Scene;
  editorState: EditorState;
  contentRevision: number;
}

export interface SceneTransaction {
  label: string;
  /**
   * Must be pure: return a new scene via path-copying. Do not mutate `scene`.
   * Unchanged pages/layers should keep object identity for structural sharing.
   * Returning the same root (or a new root that still shares every root field
   * ref) is treated as a no-op.
   */
  apply(scene: Scene): Scene;
  /**
   * When set, editor focus switches to this page in the same history step
   * (clears layer selection). Avoids an intermediate notify from a follow-up
   * `setActivePage` after content mutation.
   */
  activePageId?: string;
}

export function cloneScene(scene: Scene): Scene {
  return structuredClone(scene);
}

export function cloneEditorState(state: EditorState): EditorState {
  return structuredClone(state);
}

export function getActivePage(scene: Scene, activePageId?: string) {
  if (activePageId) {
    return scene.pages.find((p) => p.id === activePageId) ?? scene.pages[0]!;
  }
  return scene.pages[0]!;
}

export function getPrimaryLayer(scene: Scene, editorState: EditorState) {
  const page = getActivePage(scene, editorState.activePageId);
  const { primaryLayerId } = editorState;
  if (!primaryLayerId) {
    return null;
  }
  const root = page.layers.find((l) => l.id === primaryLayerId);
  if (root) {
    return root;
  }
  let found: Layer | null = null;
  walkLayers(page.layers, (layer) => {
    if (layer.id === primaryLayerId) {
      found = layer;
    }
  });
  return found;
}

export function resolveEditorPaneKind(
  scene: Scene,
  activePageId: string
): string {
  return getActivePage(scene, activePageId).layout;
}
