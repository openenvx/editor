import type { Scene } from '@openenvx/core/schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Scene, presetId: string): Scene | null;
}
