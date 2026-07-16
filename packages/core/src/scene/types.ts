import type { EditorState, Layer, Scene } from '@openenvx/schema';

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
} from '@openenvx/schema';

export interface SceneSnapshot {
  scene: Scene;
  editorState: EditorState;
  contentRevision: number;
}

export interface SceneTransaction {
  label: string;
  apply(scene: Scene): Scene;
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
