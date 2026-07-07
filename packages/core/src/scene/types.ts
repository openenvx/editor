import type { Layer, Scene } from '@openenvx/schema';

import { walkLayers } from './layer-tree';

export type {
  EditorPaneKind,
  Layer,
  Page,
  PageLayout,
  Scene,
  SceneAsset,
  Selection,
  Transform,
} from '@openenvx/schema';

export interface SceneSnapshot {
  scene: Scene;
  contentRevision: number;
}

export interface SceneTransaction {
  label: string;
  apply(scene: Scene): Scene;
}

export function cloneScene(scene: Scene): Scene {
  return structuredClone(scene);
}

export function getActivePage(scene: Scene) {
  return (
    scene.pages.find((p) => p.id === scene.activePageId) ?? scene.pages[0]!
  );
}

export function getPrimaryLayer(scene: Scene) {
  const page = getActivePage(scene);
  const { primaryLayerId } = scene.selection;
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

export function resolveEditorPaneKind(scene: Scene): string {
  return getActivePage(scene).layout;
}
