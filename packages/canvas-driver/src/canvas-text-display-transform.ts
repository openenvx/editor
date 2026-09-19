import { findLayerById } from '@openenvx/studio/core';
import type { Scene, Transform } from '@openenvx/studio/schema';

import { prepareCanvasSceneForRender } from './prepare-canvas-scene-for-render';

const CANVAS_TEXT_TYPE = 'canvas.text';

export interface CanvasTextDisplayTransformCache {
  scene: Scene | null;
  fitted: Scene | null;
}

/** Stage/inspector transform for `canvas.text` after preview substitute + remasure. */
export function resolveCanvasTextDisplayTransform(
  scene: Scene,
  layerId: string,
  cache?: CanvasTextDisplayTransformCache
): Transform | undefined {
  const stored = findLayerById(scene, layerId);
  if (!stored?.transform) {
    return undefined;
  }
  if (stored.type !== CANVAS_TEXT_TYPE) {
    return stored.transform;
  }

  let fittedScene: Scene;
  if (cache?.scene === scene && cache.fitted) {
    fittedScene = cache.fitted;
  } else {
    fittedScene = prepareCanvasSceneForRender(scene, { mode: 'preview' });
    if (cache) {
      cache.scene = scene;
      cache.fitted = fittedScene;
    }
  }

  return findLayerById(fittedScene, layerId)?.transform ?? stored.transform;
}
