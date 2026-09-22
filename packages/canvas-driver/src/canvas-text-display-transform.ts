import { findNodeById } from '@openenvx/studio/core';
import type { Document, Transform } from '@openenvx/studio/schema';
import { nodeTransform } from '@openenvx/studio/schema';

import { prepareCanvasSceneForRender } from './prepare-canvas-scene-for-render';

const CANVAS_TEXT_TYPE = 'canvas.text';

export interface CanvasTextDisplayTransformCache {
  scene: Document | null;
  fitted: Document | null;
}

/** Stage/inspector transform for `canvas.text` after preview substitute + remasure. */
export function resolveCanvasTextDisplayTransform(
  scene: Document,
  layerId: string,
  cache?: CanvasTextDisplayTransformCache
): Transform | undefined {
  const stored = findNodeById(scene, layerId);
  if (!stored?.frame) {
    return undefined;
  }
  const storedTransform = nodeTransform(stored);
  if (stored.type !== CANVAS_TEXT_TYPE) {
    return storedTransform;
  }

  let fittedScene: Document;
  if (cache?.scene === scene && cache.fitted) {
    fittedScene = cache.fitted;
  } else {
    fittedScene = prepareCanvasSceneForRender(scene, { mode: 'preview' });
    if (cache) {
      cache.scene = scene;
      cache.fitted = fittedScene;
    }
  }

  const fitted = findNodeById(fittedScene, layerId);
  return fitted ? nodeTransform(fitted) : storedTransform;
}
