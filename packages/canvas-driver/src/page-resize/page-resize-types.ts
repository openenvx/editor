import type { Scene } from '@openenvx/studio/schema';

export interface PageResizeService {
  resizeSceneToPreset(scene: Scene, presetId: string): Scene | null;
}
