import type { Transform } from '@openenvx/core/schema';

import type { CanvasInteractionMode } from '../interactions/canvas-interaction-mode';

export interface CanvasStageSnapshot {
  readonly mode: CanvasInteractionMode;
  readonly liveTransforms: ReadonlyMap<string, Transform>;
}

const EMPTY_LIVE_TRANSFORMS = new Map<string, Transform>();

export function createCanvasStageSnapshot(input: {
  mode: CanvasInteractionMode;
  liveTransforms?: ReadonlyMap<string, Transform>;
}): CanvasStageSnapshot {
  return {
    liveTransforms: input.liveTransforms ?? EMPTY_LIVE_TRANSFORMS,
    mode: input.mode,
  };
}
